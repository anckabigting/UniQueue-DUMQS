## Uniqueue - DUMQS: Digital Uniform Management & Queuing System

Uniqueque is a web-based, role-based queuing and inventory management application designed to streamline school uniform requests and distribution.This project is submitted as a partial requirement for COSC 75A: Software Engineering II.  

# 🚀 Features
- Role-Based Authentication Screen: A secure, unified entry point that routes users to their specific interface based on their account type (Student or Admin/Staff).  
- Student Portal: Real-time stock status indicator for uniform sizes. Ticket generation with dynamic ticket number tracking.Live queuing display showing the ticket currently being served.
- Admin/Staff Portal: Active queue controls to call and advance the line. Inventory management to restock uniform sizes.Adjustable daily quota limits to prevent system overload. Live diagnostic activity feed to log system changes in real-time.

# 🛠️ Testing the System (Local Mock Environment)
Currently, this system is under development and runs entirely in the browser using front-end logic and a simulated mock database. You do not need to set up a database to test it locally.  -- - Local Credentials
Use these exact combinations to test the respective user roles:
# 1. Student Gateway
Role Selection: Student
Email / ID: student@cvsu.edu.ph  
Password: password123  

# 2. Admin / Staff Gateway
Role Selection: Admin / Staff  
Email / Account ID: admin@cvsu.edu.ph  
Password: admin123  

# ⚙️ Future Enhancements & Database Migration
This project is designed with modularity in mind. Future development milestones include:
Migrating the current mock authentication system to a secure, persistent backend database.Integrating PostgreSQL hosted on NeonDB for backend database management.Implementing an API server (using Node.js/Express or Python) to handle secure password hashing (such as bcrypt) and session token validation.
