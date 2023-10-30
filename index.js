const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('employee_tracker.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY,
      name TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY,
      title TEXT,
      salary INTEGER,
      department_id INTEGER,
      FOREIGN KEY (department_id) REFERENCES departments (id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY,
      first_name TEXT,
      last_name TEXT,
      role_id INTEGER,
      manager_id INTEGER,
      FOREIGN KEY (role_id) REFERENCES roles (id),
      FOREIGN KEY (manager_id) REFERENCES employees (id)
    )
  `);
});

function viewDepartments() {
  db.all('SELECT * FROM departments', (err, rows) => {
    if (err) {
      console.error(err);
      return;
    }
    console.table(rows);
  });
}

function viewRoles() {
  db.all(`
    SELECT roles.id, title, salary, name 
    FROM roles 
    JOIN departments ON roles.department_id = departments.id
  `, (err, rows) => {
    if (err) {
      console.error(err);
      return;
    }
    console.table(rows);
  });
}

function viewEmployees() {
  db.all(`
    SELECT employees.id AS employee_id, employees.first_name, employees.last_name, 
           roles.title, departments.name AS department, roles.salary, 
           manager.first_name || ' ' || manager.last_name AS manager_name
    FROM employees 
    JOIN roles ON employees.role_id = roles.id 
    JOIN departments ON roles.department_id = departments.id 
    LEFT JOIN employees manager ON employees.manager_id = manager.id
  `, (err, rows) => {
    if (err) {
      console.error(err);
      return;
    }
    console.table(rows);
  });
}

function addDepartment(name) {
  const stmt = db.prepare('INSERT INTO departments (name) VALUES (?)');
  stmt.run(name);
  stmt.finalize();
}

function addRole(title, salary, department_id) {
  const stmt = db.prepare('INSERT INTO roles (title, salary, department_id) VALUES (?, ?, ?)');
  stmt.run(title, salary, department_id);
  stmt.finalize();
}

function addEmployee(first_name, last_name, role_id, manager_id) {
  const stmt = db.prepare('INSERT INTO employees (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)');
  stmt.run(first_name, last_name, role_id, manager_id);
  stmt.finalize();
}

function updateEmployeeRole(employee_id, new_role_id) {
  const stmt = db.prepare('UPDATE employees SET role_id = ? WHERE id = ?');
  stmt.run(new_role_id, employee_id);
  stmt.finalize();
}

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

function startCLI() {
  readline.question(
    `
Options:
1. View all departments
2. View all roles
3. View all employees
4. Add a department
5. Add a role
6. Add an employee
7. Update an employee role
8. Quit

Enter your choice: 
`,
    (choice) => {
      switch (choice) {
        case '1':
          viewDepartments();
          break;
        case '2':
          viewRoles();
          break;
        case '3':
          viewEmployees();
          break;
        case '4':
          readline.question('Enter the name of the department: ', (name) => {
            addDepartment(name);
            startCLI();
          });
          return;
        case '5':
          readline.question('Enter the title: ', (title) => {
            readline.question('Enter the salary: ', (salary) => {
              readline.question('Enter the department ID: ', (department_id) => {
                addRole(title, salary, department_id);
                startCLI();
              });
            });
          });
          return;
        case '6':
          readline.question('Enter the first name: ', (first_name) => {
            readline.question('Enter the last name: ', (last_name) => {
              readline.question('Enter the role ID: ', (role_id) => {
                readline.question('Enter the manager ID: ', (manager_id) => {
                  addEmployee(first_name, last_name, role_id, manager_id);
                  startCLI();
                });
              });
            });
          });
          return;
        case '7':
          readline.question('Enter the employee ID: ', (employee_id) => {
            readline.question('Enter the new role ID: ', (new_role_id) => {
              updateEmployeeRole(employee_id, new_role_id);
              startCLI();
            });
          });
          return;
        case '8':
          readline.close();
          db.close();
          return;
        default:
          console.log('Invalid choice. Please try again.');
      }

      startCLI();
    }
  );
}

startCLI();
