
export interface Template {
  id: string;
  nameKey: string; // Key for translation
  descKey: string; // Key for translation
  icon: string;
  sql: string;
}

export const templates: Template[] = [
  {
    id: 'ecommerce',
    nameKey: 'tpl_ecommerce',
    descKey: 'tpl_ecommerce_desc',
    icon: 'ShoppingBag',
    sql: `
CREATE TABLE users (
  id INT PRIMARY KEY COMMENT 'User ID',
  email VARCHAR(255) COMMENT 'User Email',
  password_hash VARCHAR(255),
  created_at DATETIME
);

CREATE TABLE products (
  id INT PRIMARY KEY,
  name VARCHAR(255),
  price DECIMAL(10,2),
  stock INT,
  category_id INT
);

CREATE TABLE categories (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  parent_id INT
);

CREATE TABLE orders (
  id INT PRIMARY KEY,
  user_id INT,
  total_amount DECIMAL(10,2),
  status VARCHAR(50),
  created_at DATETIME
);

CREATE TABLE order_items (
  id INT PRIMARY KEY,
  order_id INT,
  product_id INT,
  quantity INT,
  price DECIMAL(10,2)
);

CREATE TABLE reviews (
  id INT PRIMARY KEY,
  user_id INT,
  product_id INT,
  rating INT,
  comment TEXT
);

-- Relationships
ALTER TABLE products ADD CONSTRAINT fk_prod_cat FOREIGN KEY (category_id) REFERENCES categories(id);
ALTER TABLE categories ADD CONSTRAINT fk_cat_parent FOREIGN KEY (parent_id) REFERENCES categories(id);
ALTER TABLE orders ADD CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE order_items ADD CONSTRAINT fk_item_order FOREIGN KEY (order_id) REFERENCES orders(id);
ALTER TABLE order_items ADD CONSTRAINT fk_item_prod FOREIGN KEY (product_id) REFERENCES products(id);
ALTER TABLE reviews ADD CONSTRAINT fk_review_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE reviews ADD CONSTRAINT fk_review_prod FOREIGN KEY (product_id) REFERENCES products(id);
    `
  },
  {
    id: 'blog',
    nameKey: 'tpl_blog',
    descKey: 'tpl_blog_desc',
    icon: 'Newspaper',
    sql: `
CREATE TABLE users (
  id INT PRIMARY KEY,
  username VARCHAR(50),
  bio TEXT
);

CREATE TABLE posts (
  id INT PRIMARY KEY,
  author_id INT,
  title VARCHAR(255),
  slug VARCHAR(255),
  content TEXT,
  published BOOLEAN,
  created_at DATETIME
);

CREATE TABLE comments (
  id INT PRIMARY KEY,
  post_id INT,
  user_id INT,
  body TEXT,
  created_at DATETIME
);

CREATE TABLE tags (
  id INT PRIMARY KEY,
  name VARCHAR(50)
);

CREATE TABLE post_tags (
  post_id INT,
  tag_id INT,
  PRIMARY KEY (post_id, tag_id)
);

-- Relationships
ALTER TABLE posts ADD CONSTRAINT fk_post_author FOREIGN KEY (author_id) REFERENCES users(id);
ALTER TABLE comments ADD CONSTRAINT fk_comment_post FOREIGN KEY (post_id) REFERENCES posts(id);
ALTER TABLE comments ADD CONSTRAINT fk_comment_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE post_tags ADD CONSTRAINT fk_pt_post FOREIGN KEY (post_id) REFERENCES posts(id);
ALTER TABLE post_tags ADD CONSTRAINT fk_pt_tag FOREIGN KEY (tag_id) REFERENCES tags(id);
    `
  },
  {
    id: 'school',
    nameKey: 'tpl_school',
    descKey: 'tpl_school_desc',
    icon: 'GraduationCap',
    sql: `
CREATE TABLE students (
  id INT PRIMARY KEY,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  enrollment_date DATE
);

CREATE TABLE instructors (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  department VARCHAR(100)
);

CREATE TABLE courses (
  id INT PRIMARY KEY,
  title VARCHAR(100),
  credits INT,
  instructor_id INT
);

CREATE TABLE enrollments (
  id INT PRIMARY KEY,
  student_id INT,
  course_id INT,
  grade CHAR(2)
);

-- Relationships
ALTER TABLE courses ADD CONSTRAINT fk_course_inst FOREIGN KEY (instructor_id) REFERENCES instructors(id);
ALTER TABLE enrollments ADD CONSTRAINT fk_enr_stud FOREIGN KEY (student_id) REFERENCES students(id);
ALTER TABLE enrollments ADD CONSTRAINT fk_enr_course FOREIGN KEY (course_id) REFERENCES courses(id);
    `
  }
];
