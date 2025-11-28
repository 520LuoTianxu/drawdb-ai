
import { Node, Edge, MarkerType } from 'reactflow';
import { Column, TableData } from '../types';

/**
 * Robust State-Machine SQL Parser.
 * Handles:
 * - Nested parentheses in column definitions (ENUM, DECIMAL, etc.)
 * - Comments (Line and Block)
 * - Standard MySQL DDL
 */

interface ParseResult {
  nodes: Node<TableData>[];
  edges: Edge[];
}

export const parseDDL = (sql: string): ParseResult => {
  const nodes: Node<TableData>[] = [];
  const edges: Edge[] = [];
  const rawEdges: { source: string; sourceCol: string; target: string; targetCol: string, label?: string }[] = [];

  // 1. Remove Comments
  // Regex for block comments: /\*[\s\S]*?\*/g
  let cleanSql = sql.replace(/\/\*[\s\S]*?\*\//g, '');
  // Regex for line comments: -- or # to end of line
  cleanSql = cleanSql.replace(/(--|#).*$/gm, '');

  // 2. Split into statements by semicolon, respecting quotes and parens
  const statements = splitByDelimiter(cleanSql, ';');

  for (const statement of statements) {
      const trimmed = statement.trim();
      if (!trimmed) continue;

      // Check if it's a CREATE TABLE
      const createTableMatch = trimmed.match(/^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:[`"\[]?(\w+)[`"\]]?)/i);
      
      if (createTableMatch) {
          const tableName = createTableMatch[1];
          const tableId = `node-${tableName}`;

          // Extract Body: The part between the first ( and the last )
          // We need to find the first '(' that starts the body.
          const bodyStartIndex = trimmed.indexOf('(');
          if (bodyStartIndex === -1) continue;

          // Find the matching closing parenthesis for this opening one
          const bodyEndIndex = findMatchingParen(trimmed, bodyStartIndex);
          if (bodyEndIndex === -1) continue;

          const body = trimmed.substring(bodyStartIndex + 1, bodyEndIndex);
          const options = trimmed.substring(bodyEndIndex + 1);

          // Parse Options (Comment)
          let tableComment = '';
          const commentMatch = options.match(/COMMENT\s*=?\s*['"](.*?)['"]/i);
          if (commentMatch) {
              tableComment = commentMatch[1];
          }

          const columns: Column[] = [];
          
          // Split body into column definitions / constraints
          const bodyParts = splitByDelimiter(body, ',');

          for (const part of bodyParts) {
              const line = part.trim();
              if (!line) continue;
              const upperLine = line.toUpperCase();

              // Skip explicit index definitions
              if (upperLine.startsWith('KEY') || upperLine.startsWith('INDEX') || upperLine.startsWith('UNIQUE') || upperLine.startsWith('FULLTEXT')) {
                  continue;
              }

              // PRIMARY KEY constraint (inline or separate)
              // Handle separate: PRIMARY KEY (col1, col2)
              if (upperLine.startsWith('PRIMARY KEY')) {
                  const pkMatch = line.match(/PRIMARY\s+KEY\s*\((.*?)\)/i);
                  if (pkMatch) {
                      const pkCols = pkMatch[1].split(',').map(s => s.trim().replace(/[`"\[\]]/g, ''));
                      pkCols.forEach(pkName => {
                          const col = columns.find(c => c.name === pkName);
                          if (col) col.isPk = true;
                      });
                  }
                  continue;
              }

              // FOREIGN KEY constraint
              if (upperLine.startsWith('CONSTRAINT') || upperLine.startsWith('FOREIGN KEY')) {
                   const fkRegex = /FOREIGN\s+KEY\s*\(`?(\w+)`?\)\s*REFERENCES\s*[`"\[]?(\w+)[`"\]]?\s*\(`?(\w+)`?\)/i;
                   const fkMatch = line.match(fkRegex);
                   if (fkMatch) {
                       const localCol = fkMatch[1];
                       const targetTable = fkMatch[2];
                       const targetCol = fkMatch[3];
                       
                       // Mark local column
                       const col = columns.find(c => c.name === localCol);
                       if (col) col.isFk = true;

                       rawEdges.push({
                           source: `node-${targetTable}`,
                           sourceCol: targetCol,
                           target: tableId,
                           targetCol: localCol
                       });
                   }
                   continue;
              }

              // Column Definition
              // Regex allows for: `name` TYPE ...
              // We need to be careful about matching the name and type.
              // Strategy: First word is name. Second word is type.
              // But type can be ENUM(...) or DECIMAL(x,y).
              
              const firstSpace = line.indexOf(' ');
              if (firstSpace === -1) continue; // Invalid line

              let name = line.substring(0, firstSpace).replace(/[`"\[\]]/g, '');
              const rest = line.substring(firstSpace + 1).trim();

              // Check if rest starts with a Type
              // Type might contain parens: VARCHAR(50), ENUM('a','b')
              // We can split rest by space, but we must respect parens.
              
              // Helper to get first word (Type) respecting parens
              const typeEnd = findEndOfWordWithParens(rest);
              const type = rest.substring(0, typeEnd).toUpperCase();
              const modifiers = rest.substring(typeEnd).trim();

              const isPk = modifiers.toUpperCase().includes('PRIMARY KEY');
              
              let comment = '';
              const colCommentMatch = modifiers.match(/COMMENT\s+['"](.*?)['"]/i);
              if (colCommentMatch) {
                  comment = colCommentMatch[1];
              }

              columns.push({
                  id: `${tableName}-${name}`,
                  name,
                  type,
                  isPk,
                  isFk: false,
                  comment
              });
          }

          nodes.push({
              id: tableId,
              type: 'table',
              position: { x: 0, y: 0 },
              data: {
                  label: tableName,
                  columns,
                  comment: tableComment
              }
          });
      }
  }

  // Generate Edges
  rawEdges.forEach((rel, i) => {
    edges.push({
      id: `e-${i}-${Date.now()}`,
      source: rel.source,
      target: rel.target,
      sourceHandle: `${rel.source.replace('node-', '')}-${rel.sourceCol}-source`,
      targetHandle: `${rel.target.replace('node-', '')}-${rel.targetCol}-target`,
      type: 'default',
      animated: false,
      label: rel.label || '',
      style: { stroke: '#94a3b8', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' }
    });
  });

  // Infer Relationships (implicit FK)
  if (edges.length === 0 && nodes.length > 1) {
     nodes.forEach(sourceNode => {
         const pkCols = sourceNode.data.columns.filter(c => c.isPk);
         pkCols.forEach(pk => {
             nodes.forEach(targetNode => {
                 if (sourceNode.id === targetNode.id) return;
                 
                 const simpleSingular = sourceNode.data.label.endsWith('s') 
                    ? sourceNode.data.label.slice(0, -1) 
                    : sourceNode.data.label;
                 
                 const targetColName1 = `${sourceNode.data.label}_id`;
                 const targetColName2 = `${simpleSingular}_id`;

                 const match = targetNode.data.columns.find(c => 
                    c.name === targetColName1 || 
                    c.name === targetColName2
                 );

                 if (match) {
                     match.isFk = true;
                     edges.push({
                         id: `auto-e-${sourceNode.id}-${targetNode.id}`,
                         source: sourceNode.id,
                         target: targetNode.id,
                         sourceHandle: `${pk.id}-source`,
                         targetHandle: `${match.id}-target`,
                         style: { strokeDasharray: '5,5', stroke: '#64748b' },
                         label: '',
                         markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' }
                     });
                 }
             });
         });
     });
  }

  return { nodes, edges };
};

export const generateSQL = (nodes: Node<TableData>[]): string => {
  let sql = '';
  
  nodes.forEach(node => {
      sql += `CREATE TABLE \`${node.data.label}\` (\n`;
      
      const lines: string[] = [];
      const pkCols: string[] = [];

      node.data.columns.forEach(col => {
          let line = `  \`${col.name}\` ${col.type}`;
          if (col.isPk) pkCols.push(`\`${col.name}\``);
          if (col.comment) line += ` COMMENT '${col.comment}'`;
          lines.push(line);
      });

      if (pkCols.length > 0) {
          lines.push(`  PRIMARY KEY (${pkCols.join(', ')})`);
      }

      sql += lines.join(',\n');
      
      if (node.data.comment) {
          sql += `\n) COMMENT='${node.data.comment}';\n\n`;
      } else {
          sql += `\n);\n\n`;
      }
  });
  
  return sql;
};

// --- Helpers ---

// Split string by delimiter, respecting quotes and parentheses
function splitByDelimiter(text: string, delimiter: string): string[] {
    const parts: string[] = [];
    let buffer = '';
    let inQuote = false;
    let quoteChar = '';
    let parenDepth = 0;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (inQuote) {
            buffer += char;
            if (char === quoteChar && text[i - 1] !== '\\') {
                inQuote = false;
            }
        } else {
            if (char === "'" || char === '"' || char === '`') {
                inQuote = true;
                quoteChar = char;
                buffer += char;
            } else if (char === '(') {
                parenDepth++;
                buffer += char;
            } else if (char === ')') {
                parenDepth--;
                buffer += char;
            } else if (char === delimiter && parenDepth === 0) {
                parts.push(buffer);
                buffer = '';
            } else {
                buffer += char;
            }
        }
    }
    if (buffer.trim()) parts.push(buffer);
    return parts;
}

// Find matching closing parenthesis
function findMatchingParen(text: string, startIndex: number): number {
    let depth = 0;
    let inQuote = false;
    let quoteChar = '';
    
    for (let i = startIndex; i < text.length; i++) {
        const char = text[i];
        
        if (inQuote) {
             if (char === quoteChar && text[i-1] !== '\\') {
                 inQuote = false;
             }
        } else {
            if (char === "'" || char === '"' || char === '`') {
                inQuote = true;
                quoteChar = char;
            } else if (char === '(') {
                depth++;
            } else if (char === ')') {
                depth--;
                if (depth === 0) return i;
            }
        }
    }
    return -1;
}

// Find end of a word, but skip over parentheses (e.g. "VARCHAR(255)")
function findEndOfWordWithParens(text: string): number {
    let i = 0;
    let depth = 0;
    while (i < text.length) {
        const char = text[i];
        if (char === '(') depth++;
        else if (char === ')') depth--;
        else if (depth === 0 && /\s/.test(char)) {
            return i;
        }
        i++;
    }
    return i;
}
