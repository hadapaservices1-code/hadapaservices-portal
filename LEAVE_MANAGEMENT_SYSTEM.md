# Leave Management System

## Overview

The Leave Management System is a comprehensive solution that allows employees to submit leave requests and managers to approve or reject them. The system includes real-time notifications, leave balance tracking, and detailed reporting.

## Features

### For Employees
- **Submit Leave Requests**: Create new leave requests with different leave types
- **View Leave History**: See all past and current leave requests
- **Leave Balance**: Track remaining leave days for each leave type
- **Real-time Notifications**: Get notified when leave requests are approved/rejected
- **Request Details**: View detailed information about each leave request
- **Comments**: Add comments to leave requests for communication

### For Managers
- **Approve/Reject Requests**: Review and make decisions on leave requests
- **Team Overview**: See all pending requests from team members
- **Leave Statistics**: View team leave patterns and statistics
- **Notifications**: Get notified of new leave requests
- **Comments**: Add internal comments and feedback

## Database Schema

### Tables

#### `leave_types`
Stores different types of leave available in the organization.

```sql
CREATE TABLE leave_types (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  max_days_per_year INTEGER DEFAULT 0,
  requires_approval BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `leave_requests`
Stores individual leave requests from employees.

```sql
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES profiles(id),
  manager_id UUID REFERENCES profiles(id),
  leave_type_id UUID REFERENCES leave_types(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  manager_comment TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `leave_balances`
Tracks remaining leave days for each employee.

```sql
CREATE TABLE leave_balances (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES profiles(id),
  leave_type_id UUID REFERENCES leave_types(id),
  year INTEGER NOT NULL,
  total_days INTEGER NOT NULL DEFAULT 0,
  used_days INTEGER NOT NULL DEFAULT 0,
  remaining_days INTEGER GENERATED ALWAYS AS (total_days - used_days) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `leave_comments`
Stores comments on leave requests for communication.

```sql
CREATE TABLE leave_comments (
  id UUID PRIMARY KEY,
  leave_request_id UUID REFERENCES leave_requests(id),
  user_id UUID REFERENCES profiles(id),
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## API Functions

### Database Functions

#### `get_employee_leave_requests(emp_id UUID)`
Returns all leave requests for a specific employee with additional details.

#### `get_manager_pending_requests(manager_id UUID)`
Returns all pending leave requests for a manager's team.

#### `get_leave_statistics(emp_id UUID, year INTEGER)`
Returns leave statistics for an employee for a specific year.

#### `update_leave_request_status(request_id UUID, new_status TEXT, manager_comment TEXT, manager_id UUID)`
Updates the status of a leave request and handles leave balance updates.

## Components

### Employee Components

#### `EmployeeLeavePortal`
Main portal for employees to manage their leave requests.

#### `LeaveRequestForm`
Form for submitting new leave requests.

#### `LeaveRequestsList`
Displays all leave requests for an employee.

#### `LeaveBalanceCard`
Shows current leave balance and statistics.

#### `LeaveRequestDetailsModal`
Detailed view of a specific leave request.

### Manager Components

#### `ManagerLeaveDashboard`
Main dashboard for managers to review leave requests.

#### `ManagerLeaveApproval`
Interface for approving/rejecting leave requests.

#### `ManagerLeaveSummary`
Summary card showing pending requests and statistics.

### Shared Components

#### `LeaveNotifications`
Real-time notifications for leave request updates.

## Usage

### Setting Up Leave Types

1. Navigate to your Supabase dashboard
2. Go to SQL Editor
3. Run the `leave-management-schema.sql` script
4. This will create all necessary tables and seed default leave types

### Default Leave Types

The system comes with these default leave types:
- Annual Leave (25 days/year)
- Sick Leave (10 days/year)
- Personal Leave (5 days/year)
- Emergency Leave (3 days/year)
- Maternity Leave (90 days/year)
- Bereavement Leave (5 days/year)
- Study Leave (10 days/year)
- Unpaid Leave (unlimited)

### Employee Workflow

1. **Submit Request**: Employee fills out the leave request form
2. **Manager Review**: Manager receives notification and reviews the request
3. **Decision**: Manager approves or rejects with optional comments
4. **Notification**: Employee receives notification of the decision
5. **Balance Update**: If approved, leave balance is automatically updated

### Manager Workflow

1. **Notification**: Manager receives notification of new leave request
2. **Review**: Manager views request details and employee history
3. **Decision**: Manager approves or rejects with comments
4. **Update**: System updates request status and leave balance

## Security

### Row Level Security (RLS)

The system implements comprehensive RLS policies:

- **Employees** can only view their own leave requests and balances
- **Managers** can view their team's leave requests and balances
- **Comments** are restricted to request participants
- **Leave types** are publicly readable but only admins can modify

### Data Validation

- All forms use Zod schemas for validation
- Date ranges are validated (end date >= start date)
- Required fields are enforced
- Leave type selection is validated

## Testing

Run the test script to verify the system works correctly:

```sql
-- Run this in your Supabase SQL Editor
\i test-leave-system.sql
```

This will test:
- Leave type seeding
- Request creation
- Manager approval/rejection
- Leave balance updates
- RLS policies
- Database functions

## Customization

### Adding New Leave Types

```sql
INSERT INTO leave_types (name, description, max_days_per_year, requires_approval) 
VALUES ('Mental Health Day', 'Mental health and wellness day', 2, true);
```

### Modifying Leave Policies

You can modify the `max_days_per_year` and `requires_approval` fields for existing leave types:

```sql
UPDATE leave_types 
SET max_days_per_year = 30, requires_approval = false 
WHERE name = 'Personal Leave';
```

### Custom Notifications

The notification system can be extended to support:
- Email notifications
- SMS alerts
- Calendar integration
- Slack/Teams integration

## Troubleshooting

### Common Issues

1. **Leave balance not updating**: Check if the leave request was actually approved
2. **RLS errors**: Ensure the user has the correct role and permissions
3. **Missing leave types**: Run the schema script to seed default types
4. **Notification issues**: Check Supabase Realtime is enabled

### Debug Queries

```sql
-- Check leave requests for a user
SELECT * FROM leave_requests WHERE employee_id = 'user-id';

-- Check leave balances
SELECT * FROM leave_balances WHERE employee_id = 'user-id';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'leave_requests';
```

## Future Enhancements

- **Calendar Integration**: Sync approved leaves with calendar systems
- **Bulk Operations**: Approve/reject multiple requests at once
- **Advanced Reporting**: Detailed analytics and reports
- **Mobile App**: Native mobile application
- **Workflow Automation**: Custom approval workflows
- **Integration APIs**: Connect with external HR systems
