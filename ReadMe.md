# IT Asset Management Tool

## 1. Project Overview
This is a simple IT Asset Management Tool (Web) built for tracking and managing company assets.  
It supports user authentication, asset CRUD operations, exporting to Excel, dashboards, user management, and activity logs.

---

## 2. Technologies Used

### Backend
- **Language:** C# .NET 9.0 (compatible with .NET Core 6+)
- **Framework Type:** ASP.NET Core Web API
- **Libraries:**
  - BCrypt.Net-Next (for password hashing)
  - ClosedXML (for Excel export)
  - Microsoft.EntityFrameworkCore (for ORM)
  - Microsoft.EntityFrameworkCore.SqlServer
  - Microsoft.AspNetCore.OpenApi

### Frontend
- **Framework:** Angular
- **UI Library:** Bootstrap
- **Additional Packages:**
  - Chart.js (for dashboard visualization)
  - SweetAlert2 (for popup alerts)
  - @types/xlsx (for Excel integration)

### Database
- **Platform:** Microsoft SQL Server (SSMS)
- **ORM:** Entity Framework Core

### Tools & Environment
- Visual Studio 2022
- Visual Studio Code
- Node.js + npm

---

## 3. Setup Instructions

### Backend
1. Open `backend` folder in Visual Studio 2022/2019.
2. Restore NuGet packages.
3. Update `appsettings.json` with your SQL Server connection string.
4. Run migrations to create the database (if not using the provided SQL file).
   - If using `ITAssetDB.sql`, you can skip migrations.
5. Run the project.
   - Backend API runs on `https://localhost:7069` or `http://localhost:5047`.
   - Built with C# .NET 9.0 (compatible with .NET Core 6+).

### Frontend
1. Open the `frontend` folder.
2. Ensure Node.js and Angular CLI are installed globally (npm install -g @angular/cli).
3. Run `npm install` to install dependencies.
4. Run `ng serve` to start the Angular app.
5. Navigate to `http://localhost:4200`.

### Database
- Import `ITAssetDB.sql` into SQL Server to populate tables with sample data.
- Tested on SQL Server 2019 / SSMS 18+.

---

## 4. Completed Features

### Core Features
1. Authentication (Admin / User roles)
2. Asset Management
   - CRUD operations
   - Search assets
   - View asset details
3. Export asset list to Excel
4. Dashboard
   - Total assets
   - Assigned vs Unassigned assets
   - Assets needing repair/maintenance

### Optional / Extra Features
1. User Management
   - CRUD users
   - Role assignment
   - Export user list to Excel
2. Asset Activity Log
   - Records create, update, delete, assign, unassign actions

---

## 5. Screenshots / Demo
- `Screenshots/ogin.png`
- `Screenshots/changePassword.png`
- `Screenshots/Admin/dashboard_admin.png`
- `Screenshots/Admin/add_asset.png`
- `Screenshots/Admin/asset_details.png`
- `Screenshots/Admin/manage_asset_lits.png`
- `Screenshots/Admin/edit_asset.png`
- `Screenshots/Admin/delete_asset.png`
- `Screenshots/Admin/disposed_asset_list.png`
- `Screenshots/Admin/export_excel_asset.png`
- `Screenshots/Admin/search_asset.png`
- `Screenshots/Admin/add_user.png`
- `Screenshots/Admin/manage_user_list.png`
- `Screenshots/Admin/edit_user.png`
- `Screenshots/Admin/delete_user.png`
- `Screenshots/Admin/export_excel_user.png`
- `Screenshots/Admin/search_user.png`
- `Screenshots/Normal User/assigned_asset_list.png`
- `Screenshots/Normal User/dashboard_normalUser.png`

---

## 6. Diagram
- `Diagrams/ERD_Diagram.jpg`
- `Diagrams/Flow_Diagram.jpg`

---

## 7. Error Handling Strategy
1. **Invalid Inputs (Form Validation)** 
- Angular form-level validation.
- Display user-friendly error messages via SweetAlert or inline text.
- Prevent form submission when invalid.
2. **Backend Validation Errors**
- API returns BadRequest() with descriptive message.
- UI displays Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message }).
3. **Unauthorized Access**
- When x-user-role header is invalid or missing → API returns Forbid() or Unauthorized().
- Frontend detects 401 → Redirects to Login Page automatically.
- Prevents direct access to admin routes by non-admin users.
4. **Not Found**
- Backend returns NotFound() with message “User/Asset not found.”
- Frontend shows friendly alert message instead of crashing.
5. **Server Errors (500 Internal Server Error)**
- Try-catch in backend controllers catches unexpected exceptions.

---

## 8. Features Not Implemented
- **IT Request Ticket System**
  - Reason Exclusion: This feature was deprioritized due to time limitations and the focus on completing core functionalities such as user management, asset management, and authentication.
  - Planned Functionality: The system was intended to allow users to submit IT-related requests such as hardware issues, software installation, or system troubleshooting. Administrators would be able to review, assign, and resolve these tickets, improving internal IT support efficiency.
  - Future Enhancement Plan: Future development could include implementing a dedicated Tickets table and corresponding API endpoints (e.g., POST /api/tickets, PUT /api/tickets/{id}, GET /api/tickets). The frontend would feature a user-friendly interface for users to submit and track their requests, while administrators would have a dashboard to manage ticket statuses such as Pending, In Progress, and Resolved.