
import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'zh';

const translations = {
  en: {
    // Header
    app_title: 'ER-Architect',
    import: 'Import',
    export_ddl: 'DDL',
    table: 'Table',
    search_placeholder: 'Search table...',
    projects: 'Projects',
    
    // Canvas / General
    undo_tooltip: 'Undo (Ctrl+Z)',
    redo_tooltip: 'Redo (Ctrl+Y)',
    auto_layout_tooltip: 'Auto Layout',
    export_png_tooltip: 'Export as PNG',
    shortcuts_tooltip: 'Shortcuts',
    saving: 'Saving...',
    saved: 'Saved',
    
    // Toast Messages
    toast_saved: 'Project saved successfully.',
    toast_copy_success: 'Duplicate successful.',
    toast_import_success: 'Import successful.',
    toast_import_fail: 'Import failed. Please check your SQL syntax.',
    toast_export_success: 'Export started.',
    toast_ai_success: 'Schema generated successfully.',
    toast_ai_fail: 'AI Generation failed.',
    
    // Project Manager
    pm_title: 'Project Manager',
    pm_create_new: 'Create New Project',
    pm_no_projects: 'No projects found. Create one to get started.',
    pm_last_modified: 'Last modified',
    pm_delete_confirm: 'Are you sure you want to delete this project?',
    pm_delete: 'Delete',
    pm_open: 'Open',
    pm_name_placeholder: 'Project Name',
    pm_rename: 'Rename',
    pm_templates: 'Templates',
    pm_blank: 'Blank Project',
    pm_blank_desc: 'Start from scratch with an empty canvas.',
    pm_back: 'Back to Projects',

    // Templates
    tpl_ecommerce: 'E-Commerce',
    tpl_ecommerce_desc: 'Standard online store schema with products, orders, and users.',
    tpl_blog: 'Blog System',
    tpl_blog_desc: 'Content management system with posts, comments, and tags.',
    tpl_school: 'School Management',
    tpl_school_desc: 'Educational system with students, courses, and enrollments.',

    // AI Architect
    ai_btn_tooltip: 'AI Architect',
    ai_title: 'AI Architect',
    ai_desc: 'Describe your desired application or database system in plain language, and the AI will generate a complete ER diagram for you.',
    ai_placeholder: 'E.g. Design a Learning Management System for a university with students, courses, instructors, enrollments, and grades...',
    ai_generate: 'Generate Schema',
    ai_generating: 'Designing Database...',
    ai_error: 'Failed to generate schema. Please try again.',
    ai_review: 'Review & Edit SQL',
    ai_review_desc: 'Please review the generated SQL. You can edit it before applying to the canvas.',
    ai_apply: 'Apply to Canvas',

    // Import Modal
    import_title: 'Import DDL SQL',
    import_instruction: 'Paste your CREATE TABLE statements below. Supported: MySQL, PostgreSQL (Basic), MariaDB.',
    upload_btn: 'Upload .sql File',
    paste_or: 'or paste text below',
    import_placeholder: 'CREATE TABLE users ( id INT PRIMARY KEY, ... );',
    import_error_empty: 'Please enter some SQL DDL statements.',
    import_error_fail: 'Failed to parse SQL.',
    cancel: 'Cancel',
    parse_generate: 'Parse & Generate',
    
    // Export Modal
    export_title: 'Export Image',
    auto_layout: 'Auto Layout & Center',
    auto_layout_desc: 'Reorganize tables and center the diagram before exporting to ensure everything is visible and tidy.',
    bg_color: 'Background Color',
    click_to_change: 'Click color box to change',
    export_btn: 'Export PNG',
    
    // Editor Panel
    edit_table: 'Edit Table',
    duplicate_table: 'Duplicate Table',
    table_name: 'Table Name',
    comment: 'Comment',
    color: 'Color',
    columns: 'Columns',
    add: 'Add',
    column_name_placeholder: 'name',
    column_comment_placeholder: 'Column comment...',
    save_changes: 'Save Changes',
    no_columns: 'No columns defined.',
    double_click_edit: 'Double click to edit.',
    
    // Relationship Modal
    rel_title: 'Define Relationship',
    one_to_one: 'One-to-One',
    one_to_many: 'One-to-Many',
    many_to_one: 'Many-to-One',
    many_to_many: 'Many-to-Many',
    
    // Shortcuts
    shortcuts_title: 'Keyboard Shortcuts',
    sc_del: 'Delete selected table or relationship',
    sc_undo: 'Undo last action',
    sc_redo: 'Redo last action',
    sc_save: 'Save project (Simulated)',
    sc_multiselect: 'Multi-select nodes',
    sc_zoom: 'Zoom In / Out',
    sc_pan: 'Pan Canvas',
    sc_edit: 'Edit Table Structure',
    close: 'Close',
  },
  zh: {
     // Header
    app_title: 'ER-Architect',
    import: '导入',
    export_ddl: 'DDL',
    table: '新建表',
    search_placeholder: '搜索表名...',
    projects: '项目管理',
    
    // Canvas / General
    undo_tooltip: '撤销 (Ctrl+Z)',
    redo_tooltip: '重做 (Ctrl+Y)',
    auto_layout_tooltip: '自动排版',
    export_png_tooltip: '导出 PNG',
    shortcuts_tooltip: '快捷键',
    saving: '保存中...',
    saved: '已保存',
    
    // Toast Messages
    toast_saved: '项目保存成功',
    toast_copy_success: '复制成功',
    toast_import_success: '导入成功',
    toast_import_fail: '导入失败，请检查 SQL 语法',
    toast_export_success: '导出已开始',
    toast_ai_success: '架构生成成功',
    toast_ai_fail: 'AI 生成失败',

    // Project Manager
    pm_title: '项目管理',
    pm_create_new: '新建项目',
    pm_no_projects: '暂无项目，请新建。',
    pm_last_modified: '最后修改',
    pm_delete_confirm: '确定要删除该项目吗？',
    pm_delete: '删除',
    pm_open: '打开',
    pm_name_placeholder: '项目名称',
    pm_rename: '重命名',
    pm_templates: '选择模板',
    pm_blank: '空白项目',
    pm_blank_desc: '从零开始，创建一个空白画布。',
    pm_back: '返回项目列表',

    // Templates
    tpl_ecommerce: '电商系统',
    tpl_ecommerce_desc: '标准的在线商城结构，包含商品、订单、用户和评价。',
    tpl_blog: '博客系统',
    tpl_blog_desc: '内容管理系统，包含文章、评论、标签和作者。',
    tpl_school: '教务管理',
    tpl_school_desc: '学校教育系统，包含学生、课程、教师和选课记录。',

    // AI Architect
    ai_btn_tooltip: 'AI 智能生成',
    ai_title: 'AI 架构师',
    ai_desc: '用自然语言描述您想要的应用或系统，AI 将为您生成完整的 ER 图结构。',
    ai_placeholder: '例如：设计一个包含学生、课程、教师、选课记录和成绩的大学教务管理系统...',
    ai_generate: '生成架构',
    ai_generating: '正在设计数据库...',
    ai_error: '生成失败，请重试。',
    ai_review: '审查与编辑 SQL',
    ai_review_desc: '请查看生成的 SQL。您可以在应用到画布之前对其进行编辑。',
    ai_apply: '应用到画布',

    // Import Modal
    import_title: '导入 DDL SQL',
    import_instruction: '请在下方粘贴 CREATE TABLE 语句。支持：MySQL, PostgreSQL (基础), MariaDB。',
    upload_btn: '上传 .sql 文件',
    paste_or: '或在下方粘贴',
    import_placeholder: 'CREATE TABLE users ( id INT PRIMARY KEY, ... );',
    import_error_empty: '请输入一些 SQL DDL 语句。',
    import_error_fail: 'SQL 解析失败。',
    cancel: '取消',
    parse_generate: '解析并生成',
    
    // Export Modal
    export_title: '导出图片',
    auto_layout: '自动排版并居中',
    auto_layout_desc: '导出前重新排列表格并居中，确保所有内容整洁可见。',
    bg_color: '背景颜色',
    click_to_change: '点击色块修改',
    export_btn: '导出 PNG',
    
    // Editor Panel
    edit_table: '编辑表格',
    duplicate_table: '复制表格',
    table_name: '表名',
    comment: '注释',
    color: '颜色',
    columns: '字段列表',
    add: '添加',
    column_name_placeholder: '字段名',
    column_comment_placeholder: '字段注释...',
    save_changes: '保存修改',
    no_columns: '未定义字段。',
    double_click_edit: '双击进行编辑。',
    
    // Relationship Modal
    rel_title: '定义关联关系',
    one_to_one: '一对一 (1:1)',
    one_to_many: '一对多 (1:N)',
    many_to_one: '多对一 (N:1)',
    many_to_many: '多对多 (N:N)',
    
    // Shortcuts
    shortcuts_title: '键盘快捷键',
    sc_del: '删除选中的表格或连线',
    sc_undo: '撤销上一步操作',
    sc_redo: '重做上一步操作',
    sc_save: '保存项目 (模拟)',
    sc_multiselect: '多选节点 (Shift + 拖拽)',
    sc_zoom: '放大 / 缩小',
    sc_pan: '拖动画布 (Space + 拖拽)',
    sc_edit: '编辑表格结构',
    close: '关闭',
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.en) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: keyof typeof translations.en) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
