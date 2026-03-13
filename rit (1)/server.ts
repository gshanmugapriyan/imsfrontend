import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("rit_portal.db");
const JWT_SECRET = "rit_portal_secret_key_2024";

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT,
    full_name TEXT,
    profile_picture TEXT
  );

  CREATE TABLE IF NOT EXISTS dashboard_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT,
    title TEXT,
    value TEXT,
    change TEXT,
    icon TEXT,
    color TEXT
  );

  CREATE TABLE IF NOT EXISTS academic_performance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    department TEXT,
    performance INTEGER,
    target INTEGER
  );

  CREATE TABLE IF NOT EXISTS faculty_workload (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    department TEXT,
    teaching INTEGER,
    research INTEGER,
    admin INTEGER
  );

  CREATE TABLE IF NOT EXISTS budget_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT,
    allocated INTEGER,
    spent INTEGER
  );

  CREATE TABLE IF NOT EXISTS compliance_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task TEXT,
    status TEXT,
    deadline TEXT
  );

  CREATE TABLE IF NOT EXISTS attendance_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT,
    present INTEGER,
    total INTEGER,
    date TEXT
  );

  CREATE TABLE IF NOT EXISTS discipline_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    count INTEGER,
    status TEXT
  );

  CREATE TABLE IF NOT EXISTS fee_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    department TEXT,
    collected INTEGER,
    total INTEGER
  );

  CREATE TABLE IF NOT EXISTS syllabus_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    department TEXT,
    completed INTEGER,
    total INTEGER
  );

  CREATE TABLE IF NOT EXISTS inventory_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item TEXT,
    quantity INTEGER,
    status TEXT
  );

  CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    name TEXT,
    grade TEXT,
    courses TEXT
  );

  CREATE TABLE IF NOT EXISTS approvals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    requester TEXT,
    reason TEXT,
    status TEXT DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS system_config (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS internal_assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject TEXT,
    date TEXT,
    average_score INTEGER,
    status TEXT
  );

  CREATE TABLE IF NOT EXISTS counseling_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mentor_id INTEGER,
    student_name TEXT,
    date TEXT,
    topic TEXT,
    outcome TEXT
  );

  CREATE TABLE IF NOT EXISTS feedback_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_name TEXT,
    date TEXT,
    feedback_text TEXT,
    status TEXT
  );
`);

// Seed Data (Individual Table Checks)
const seedUsers = () => {
  // Check if we have plain text passwords (from previous version)
  const users = db.prepare("SELECT * FROM users").all() as any[];
  const hasPlainText = users.some(u => !u.password.startsWith('$2a$'));
  
  if (hasPlainText || users.length === 0 || !users[0].profile_picture) {
    db.prepare("DELETE FROM users").run();
    const insert = db.prepare("INSERT INTO users (username, password, role, full_name, profile_picture) VALUES (?, ?, ?, ?, ?)");
    const salt = bcrypt.genSaltSync(10);
    insert.run("director", bcrypt.hashSync("director123", salt), "director_dean", "Dr. Ramesh Kumar", "https://randomuser.me/api/portraits/men/45.jpg");
    insert.run("faculty", bcrypt.hashSync("faculty123", salt), "faculty", "Prof. Anitha", "https://randomuser.me/api/portraits/women/44.jpg");
    insert.run("student", bcrypt.hashSync("student123", salt), "student", "Aditya Sharma", "https://randomuser.me/api/portraits/men/22.jpg");
    insert.run("admin", bcrypt.hashSync("admin123", salt), "admin", "Suresh Kumar", "https://randomuser.me/api/portraits/men/32.jpg");
    insert.run("principal", bcrypt.hashSync("principal123", salt), "principal", "Dr. S. Venkatesh", "https://randomuser.me/api/portraits/men/1.jpg");
    insert.run("vice_principal", bcrypt.hashSync("vp123", salt), "vice_principal", "Dr. M. Lakshmi", "https://randomuser.me/api/portraits/women/2.jpg");
    insert.run("class_in_charge", bcrypt.hashSync("cic123", salt), "class_in_charge", "Prof. Rajesh", "https://randomuser.me/api/portraits/men/3.jpg");
    insert.run("mentor", bcrypt.hashSync("mentor123", salt), "mentor", "Prof. Priya", "https://randomuser.me/api/portraits/women/4.jpg");
    console.log("Users re-seeded with hashed passwords and profile pictures.");
  }
};

const seedStats = () => {
  const count = (db.prepare("SELECT COUNT(*) as count FROM dashboard_stats").get() as any).count;
  if (count === 0) {
    const insert = db.prepare("INSERT INTO dashboard_stats (role, title, value, change, icon, color) VALUES (?, ?, ?, ?, ?, ?)");
    // Principal Stats
    insert.run("principal", "Total Students", "3,450", "Active", "Users", "blue");
    insert.run("principal", "Faculty Count", "185", "Full-time", "GraduationCap", "emerald");
    insert.run("principal", "Budget Status", "84%", "Utilized", "DollarSign", "indigo");
    insert.run("principal", "Compliance", "98%", "Excellent", "ShieldCheck", "amber");

    // Vice Principal Stats
    insert.run("vice_principal", "Academic Progress", "92%", "On Track", "BookOpen", "blue");
    insert.run("vice_principal", "Attendance Avg", "89%", "Stable", "CheckCircle2", "emerald");
    insert.run("vice_principal", "Pending Approvals", "12", "Action Required", "ClipboardList", "indigo");
    insert.run("vice_principal", "Events Today", "3", "Active", "Calendar", "amber");

    // Class In-Charge Stats
    insert.run("class_in_charge", "Class Attendance", "91%", "Today", "Users", "blue");
    insert.run("class_in_charge", "Internal Marks", "85%", "Average", "Award", "emerald");
    insert.run("class_in_charge", "Syllabus Status", "75%", "Completed", "BookOpen", "indigo");
    insert.run("class_in_charge", "Pending Tasks", "4", "This Week", "Clock", "amber");

    // Mentor Stats
    insert.run("mentor", "Assigned Mentees", "25", "Active", "Users", "blue");
    insert.run("mentor", "Counseling Sessions", "8", "This Month", "MessageSquare", "emerald");
    insert.run("mentor", "Mentee Performance", "82%", "Avg GPA", "TrendingUp", "indigo");
    insert.run("mentor", "Alerts", "2", "Critical", "AlertCircle", "amber");

    // Director/Dean Stats
    insert.run("director_dean", "Dept Performance", "92%", "Above Target", "TrendingUp", "blue");
    insert.run("director_dean", "Academic Progress", "On Track", "All Depts", "BookOpen", "emerald");
    insert.run("director_dean", "Program Status", "Active", "Monitoring", "ShieldCheck", "indigo");
    insert.run("director_dean", "Research Output", "15 Papers", "This Quarter", "Award", "amber");

    // Faculty Stats
    insert.run("faculty", "Class Attendance", "88%", "Stable", "Users", "emerald");
    insert.run("faculty", "Pending Marks", "2 Subjects", "Action Required", "ClipboardList", "amber");
    insert.run("faculty", "Assignments", "5 Active", "Reviewing", "BookOpen", "blue");
    insert.run("faculty", "Mentee Feedback", "4 New", "Action Required", "MessageSquare", "indigo");

    // Student Stats
    insert.run("student", "My Attendance", "94%", "Excellent", "CheckCircle2", "emerald");
    insert.run("student", "Current CGPA", "3.85", "Target: 4.0", "Award", "blue");
    insert.run("student", "Pending Tasks", "3 Due", "This Week", "Clock", "amber");
    insert.run("student", "Fee Status", "Paid", "No Dues", "CreditCard", "indigo");

    // Admin Stats
    insert.run("admin", "Office Staff", "12", "Active", "Building2", "blue");
    insert.run("admin", "Budget Status", "1 Pending", "Reviewing", "ShieldCheck", "emerald");
    insert.run("admin", "Inventory", "84%", "Sufficient", "Package", "indigo");
    insert.run("admin", "Timetable", "Morning/Afternoon", "Constraints Set", "ClipboardList", "amber");
  }
};

const seedPerformance = () => {
  const count = (db.prepare("SELECT COUNT(*) as count FROM academic_performance").get() as any).count;
  if (count === 0) {
    const insert = db.prepare("INSERT INTO academic_performance (department, performance, target) VALUES (?, ?, ?)");
    insert.run("Computer Science", 90, 85); // 4.5 * 20
    insert.run("Electronics", 84, 85); // 4.2 * 20
    insert.run("Mechanical", 92, 85); // 4.6 * 20
  }
};

const seedWorkload = () => {
  const count = (db.prepare("SELECT COUNT(*) as count FROM faculty_workload").get() as any).count;
  if (count === 0) {
    const insert = db.prepare("INSERT INTO faculty_workload (department, teaching, research, admin) VALUES (?, ?, ?, ?)");
    insert.run("Computer Science", 16, 10, 5);
    insert.run("Electronics", 14, 8, 4);
    insert.run("Mechanical", 18, 12, 6);
  }
};

const seedBudget = () => {
  const count = (db.prepare("SELECT COUNT(*) as count FROM budget_items").get() as any).count;
  if (count === 0) {
    const insert = db.prepare("INSERT INTO budget_items (category, allocated, spent) VALUES (?, ?, ?)");
    insert.run("Computer Science", 50000, 0);
    insert.run("Mechanical", 35000, 35000);
  }
};

const seedCompliance = () => {
  const count = (db.prepare("SELECT COUNT(*) as count FROM compliance_tasks").get() as any).count;
  if (count === 0) {
    const insert = db.prepare("INSERT INTO compliance_tasks (task, status, deadline) VALUES (?, ?, ?)");
    insert.run("Faculty Credential Review", "Completed", "2024-03-01");
    insert.run("Budget Audit", "In Progress", "2024-04-15");
  }
};

const seedAttendance = () => {
  const count = (db.prepare("SELECT COUNT(*) as count FROM attendance_data").get() as any).count;
  if (count === 0) {
    const insert = db.prepare("INSERT INTO attendance_data (category, present, total, date) VALUES (?, ?, ?, ?)");
    insert.run("Students", 850, 1000, "2024-03-10");
    insert.run("Faculty", 45, 50, "2024-03-10");
    insert.run("Staff", 28, 30, "2024-03-10");
  }
};

const seedDiscipline = () => {
  const count = (db.prepare("SELECT COUNT(*) as count FROM discipline_data").get() as any).count;
  if (count === 0) {
    const insert = db.prepare("INSERT INTO discipline_data (type, count, status) VALUES (?, ?, ?)");
    insert.run("Late Arrival", 12, "Resolved");
    insert.run("Dress Code", 5, "Pending");
    insert.run("Grievance", 2, "In Review");
  }
};

const seedFees = () => {
  const count = (db.prepare("SELECT COUNT(*) as count FROM fee_data").get() as any).count;
  if (count === 0) {
    const insert = db.prepare("INSERT INTO fee_data (department, collected, total) VALUES (?, ?, ?)");
    insert.run("Computer Science", 450000, 500000);
    insert.run("Electronics", 380000, 420000);
    insert.run("Mechanical", 320000, 400000);
  }
};

const seedSyllabus = () => {
  const count = (db.prepare("SELECT COUNT(*) as count FROM syllabus_data").get() as any).count;
  if (count === 0) {
    const insert = db.prepare("INSERT INTO syllabus_data (department, completed, total) VALUES (?, ?, ?)");
    insert.run("Computer Science", 75, 100);
    insert.run("Electronics", 68, 100);
    insert.run("Mechanical", 82, 100);
  }
};

const seedInventory = () => {
  const count = (db.prepare("SELECT COUNT(*) as count FROM inventory_data").get() as any).count;
  if (count === 0) {
    const insert = db.prepare("INSERT INTO inventory_data (item, quantity, status) VALUES (?, ?, ?)");
    insert.run("Laptops", 50, "Available");
    insert.run("Projectors", 15, "In Use");
    insert.run("Lab Equipment", 120, "Maintenance");
  }
};

const seedStudents = () => {
  const count = (db.prepare("SELECT COUNT(*) as count FROM students").get() as any).count;
  if (count === 0) {
    const insert = db.prepare("INSERT INTO students (id, name, grade, courses) VALUES (?, ?, ?, ?)");
    insert.run("STU001", "Aditya Sharma", "A", "Data Structures, Algorithms, DBMS");
    insert.run("STU002", "Priya Patel", "B+", "Operating Systems, Computer Networks");
    insert.run("STU003", "Rahul Verma", "A-", "Machine Learning, Artificial Intelligence");
    insert.run("STU004", "Sneha Reddy", "A", "Cloud Computing, Cyber Security");
    insert.run("STU005", "Vikram Singh", "B", "Software Engineering, Web Development");
  }
};

  const seedApprovals = () => {
    const count = (db.prepare("SELECT COUNT(*) as count FROM approvals").get() as any).count;
    if (count === 0) {
      const insert = db.prepare("INSERT INTO approvals (type, requester, reason, status) VALUES (?, ?, ?, ?)");
      // Leave Requests
      insert.run("On Duty (OD) Requests", "Dr. Ravi", "Faculty Leave Request", "Pending");
      insert.run("Casual Leave (CL)", "Prof. Meena", "Faculty Leave Request", "Approved");
      insert.run("Compensatory Leave", "Dr. Suresh", "Faculty Leave Request", "Pending");
      // Events
      insert.run("Event Approvals", "Computer Science", "Tech Symposium", "Pending");
      insert.run("Event Approvals", "Electronics", "Robotics Workshop", "Approved");
      // Budgets
      insert.run("Budget Approvals", "Computer Science", "Requested: 50000", "Pending");
      insert.run("Budget Approvals", "Mechanical", "Requested: 35000", "Approved");
    }
  };

const seedConfig = () => {
  const count = (db.prepare("SELECT COUNT(*) as count FROM system_config").get() as any).count;
  if (count === 0) {
    const insert = db.prepare("INSERT INTO system_config (key, value) VALUES (?, ?)");
    insert.run("acting_principal", "None");
    insert.run("timetable_status", "Generated");
  }
};

const seedClassInChargeData = () => {
  const assessCount = (db.prepare("SELECT COUNT(*) as count FROM internal_assessments").get() as any).count;
  if (assessCount === 0) {
    const insert = db.prepare("INSERT INTO internal_assessments (subject, date, average_score, status) VALUES (?, ?, ?, ?)");
    insert.run("Mathematics", "2024-03-05", 82, "Completed");
    insert.run("Physics", "2024-03-20", 75, "Scheduled");
  }
};

const seedMentorData = () => {
  const counselCount = (db.prepare("SELECT COUNT(*) as count FROM counseling_records").get() as any).count;
  if (counselCount === 0) {
    const insert = db.prepare("INSERT INTO counseling_records (mentor_id, student_name, date, topic, outcome) VALUES (?, ?, ?, ?, ?)");
    insert.run(5, "Rahul Verma", "2024-03-08", "Career Goals", "Discussed AI career paths");
    insert.run(5, "Sneha Reddy", "2024-03-11", "Stress Management", "Follow up next month");
  }

  const feedbackCount = (db.prepare("SELECT COUNT(*) as count FROM feedback_records").get() as any).count;
  if (feedbackCount === 0) {
    const insert = db.prepare("INSERT INTO feedback_records (student_name, date, feedback_text, status) VALUES (?, ?, ?, ?)");
    insert.run("Rahul Verma", "2024-03-10", "Great guidance on research papers.", "Resolved");
    insert.run("Sneha Reddy", "2024-03-12", "Need more resources for cloud security.", "Pending");
  }
};

const seedCalendar = () => {
  const count = (db.prepare("SELECT COUNT(*) as count FROM academic_calendar").get() as any).count;
  if (count === 0) {
    const insert = db.prepare("INSERT INTO academic_calendar (event, date, type) VALUES (?, ?, ?)");
    insert.run("Semester Start", "2024-01-15", "Academic");
    insert.run("Mid-Term Exams", "2024-03-10", "Examination");
    insert.run("Tech Symposium", "2024-04-05", "Event");
    insert.run("End-Semester Exams", "2024-05-20", "Examination");
  }
};

const seedTimetable = () => {
  const count = (db.prepare("SELECT COUNT(*) as count FROM timetable_entries").get() as any).count;
  if (count === 0) {
    const insert = db.prepare("INSERT INTO timetable_entries (day, time, subject, room, role_id) VALUES (?, ?, ?, ?, ?)");
    insert.run("Monday", "09:00 - 10:00", "Data Structures", "L-101", "student");
    insert.run("Monday", "10:00 - 11:00", "Algorithms", "L-101", "student");
    insert.run("Tuesday", "09:00 - 10:00", "DBMS", "L-102", "student");
    insert.run("Wednesday", "11:00 - 12:00", "Operating Systems", "L-103", "student");
  }
};

const seedMarks = () => {
  const count = (db.prepare("SELECT COUNT(*) as count FROM student_marks").get() as any).count;
  if (count === 0) {
    const insert = db.prepare("INSERT INTO student_marks (student_id, subject, internal_marks, semester_marks, total_marks, grade) VALUES (?, ?, ?, ?, ?, ?)");
    insert.run("STU001", "Data Structures", 25, 65, 90, "A+");
    insert.run("STU001", "Algorithms", 22, 60, 82, "A");
    insert.run("STU001", "DBMS", 24, 62, 86, "A");
  }
};

const seedAssignments = () => {
  const count = (db.prepare("SELECT COUNT(*) as count FROM assignments").get() as any).count;
  if (count === 0) {
    const insert = db.prepare("INSERT INTO assignments (title, subject, deadline, status, faculty_id) VALUES (?, ?, ?, ?, ?)");
    insert.run("Binary Search Trees", "Data Structures", "2024-03-15", "Pending", 2);
    insert.run("SQL Queries Lab", "DBMS", "2024-03-20", "Submitted", 2);
    insert.run("Process Scheduling", "Operating Systems", "2024-03-25", "Pending", 2);
  }
};

// Execute Seeding
db.exec(`
  DELETE FROM dashboard_stats;
  DELETE FROM academic_performance;
  DELETE FROM faculty_workload;
  DELETE FROM budget_items;
  DELETE FROM compliance_tasks;
  DELETE FROM attendance_data;
  DELETE FROM discipline_data;
  DELETE FROM fee_data;
  DELETE FROM syllabus_data;
  DELETE FROM inventory_data;
  DELETE FROM students;
  DELETE FROM approvals;
  DELETE FROM system_config;
  DELETE FROM internal_assessments;
  DROP TABLE IF EXISTS counseling_records;
  DROP TABLE IF EXISTS feedback_records;
  DROP TABLE IF EXISTS academic_calendar;
  DROP TABLE IF EXISTS timetable_entries;
  DROP TABLE IF EXISTS student_marks;
  DROP TABLE IF EXISTS assignments;
  CREATE TABLE IF NOT EXISTS counseling_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mentor_id INTEGER,
    student_name TEXT,
    date TEXT,
    topic TEXT,
    outcome TEXT
  );
  CREATE TABLE IF NOT EXISTS feedback_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_name TEXT,
    date TEXT,
    feedback_text TEXT,
    status TEXT
  );
  CREATE TABLE IF NOT EXISTS academic_calendar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event TEXT,
    date TEXT,
    type TEXT
  );
  CREATE TABLE IF NOT EXISTS timetable_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day TEXT,
    time TEXT,
    subject TEXT,
    room TEXT,
    role_id TEXT
  );
  CREATE TABLE IF NOT EXISTS student_marks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT,
    subject TEXT,
    internal_marks INTEGER,
    semester_marks INTEGER,
    total_marks INTEGER,
    grade TEXT
  );
  CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    subject TEXT,
    deadline TEXT,
    status TEXT,
    faculty_id INTEGER
  );
`);
seedUsers();
seedStats();
seedPerformance();
seedWorkload();
seedBudget();
seedCompliance();
seedAttendance();
seedDiscipline();
seedFees();
seedSyllabus();
seedInventory();
seedStudents();
seedApprovals();
seedConfig();
seedCalendar();
seedTimetable();
seedMarks();
seedAssignments();
seedClassInChargeData();
seedMentorData();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Middleware: Auth Check
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // API: Login (RBAC Enforcement)
  app.post("/api/login", (req, res) => {
    const { username, password, selectedRole } = req.body;

    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as any;

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // RBAC: Check if the user's actual role matches the selected role
    if (user.role !== selectedRole) {
      return res.status(403).json({ 
        error: `Access Denied: You are registered as ${user.role.replace('_', ' ')}, not ${selectedRole.replace('_', ' ')}.` 
      });
    }

    // Generate Token
    const token = jwt.sign({ id: user.id, role: user.role, fullName: user.full_name }, JWT_SECRET, { expiresIn: "24h" });

    // Success: Return user data
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.full_name,
        profilePicture: user.profile_picture
      }
    });
  });

  // API: Get Dashboard Data
  app.get("/api/dashboard/:role", authenticate, (req, res) => {
    const { role } = req.params;
    
    const stats = db.prepare("SELECT * FROM dashboard_stats WHERE role = ?").all(role);
    const performance = db.prepare("SELECT * FROM academic_performance").all();
    const workload = db.prepare("SELECT * FROM faculty_workload").all();
    const budget = db.prepare("SELECT * FROM budget_items").all();
    const compliance = db.prepare("SELECT * FROM compliance_tasks").all();
    const attendance = db.prepare("SELECT * FROM attendance_data").all();
    const discipline = db.prepare("SELECT * FROM discipline_data").all();
    const fees = db.prepare("SELECT * FROM fee_data").all();
    const syllabus = db.prepare("SELECT * FROM syllabus_data").all();
    const inventory = db.prepare("SELECT * FROM inventory_data").all();
    const students = db.prepare("SELECT * FROM students").all();
    const pendingApprovals = db.prepare("SELECT * FROM approvals WHERE status = 'Pending' ORDER BY created_at DESC").all();
    const approvalHistory = db.prepare("SELECT * FROM approvals WHERE status != 'Pending' ORDER BY created_at DESC").all();
    const actingPrincipal = db.prepare("SELECT value FROM system_config WHERE key = 'acting_principal'").get() as any;
    const timetableStatus = db.prepare("SELECT value FROM system_config WHERE key = 'timetable_status'").get() as any;

    const internalAssessments = db.prepare("SELECT * FROM internal_assessments").all();
    const counselingRecords = db.prepare("SELECT * FROM counseling_records").all();
    const feedbackRecords = db.prepare("SELECT * FROM feedback_records").all();
    const calendar = db.prepare("SELECT * FROM academic_calendar").all();
    const timetable = db.prepare("SELECT * FROM timetable_entries").all();
    const marks = db.prepare("SELECT * FROM student_marks").all();
    const assignments = db.prepare("SELECT * FROM assignments").all();

    res.json({
      stats,
      performance,
      workload,
      budget,
      compliance,
      attendance,
      discipline,
      fees,
      syllabus,
      inventory,
      students,
      approvals: pendingApprovals,
      approvalHistory,
      actingPrincipal: actingPrincipal?.value,
      timetableStatus: timetableStatus?.value,
      internalAssessments,
      counselingRecords,
      feedbackRecords,
      calendar,
      timetable,
      marks,
      assignments
    });
  });

  // API: Update Approval Details (Editing)
  app.put("/api/approvals/:id", authenticate, (req: any, res) => {
    const { id } = req.params;
    const { type, requester, reason, status } = req.body;
    
    if (req.user.role !== 'principal' && req.user.role !== 'vice_principal') {
      return res.status(403).json({ error: "Unauthorized to edit approvals" });
    }

    db.prepare("UPDATE approvals SET type = ?, requester = ?, reason = ?, status = ? WHERE id = ?")
      .run(type, requester, reason, status, id);
    
    res.json({ success: true });
  });

  // API: Update Profile Picture
  app.post("/api/user/profile-picture", authenticate, (req: any, res) => {
    const { profilePicture } = req.body;
    const userId = req.user.id;

    if (!profilePicture) {
      return res.status(400).json({ error: "Profile picture data is required" });
    }

    db.prepare("UPDATE users SET profile_picture = ? WHERE id = ?").run(profilePicture, userId);
    res.json({ success: true });
  });

  // API: Update Approval Status
  app.post("/api/approvals/:id", authenticate, (req: any, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    if (req.user.role !== 'principal' && req.user.role !== 'vice_principal') {
      return res.status(403).json({ error: "Unauthorized to perform approvals" });
    }

    db.prepare("UPDATE approvals SET status = ? WHERE id = ?").run(status, id);
    res.json({ success: true });
  });

  // API: Assign Acting Principal
  app.post("/api/system/acting-principal", authenticate, (req: any, res) => {
    const { name } = req.body;
    if (req.user.role !== 'principal') return res.status(403).json({ error: "Only Principal can assign acting principal" });

    db.prepare("UPDATE system_config SET value = ? WHERE key = 'acting_principal'").run(name);
    res.json({ success: true, name });
  });

  // API: Run AI Scheduler
  app.post("/api/system/run-scheduler", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Only Admin can run scheduler" });

    // Simulate work
    setTimeout(() => {
      db.prepare("UPDATE system_config SET value = 'Generated' WHERE key = 'timetable_status'").run();
    }, 2000);

    res.json({ success: true, message: "Scheduler started" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
