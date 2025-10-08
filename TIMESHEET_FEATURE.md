# Timesheet Feature

## Overview
A comprehensive timesheet system that allows employees to log time against projects created by managers. This feature provides detailed time tracking, project-based logging, and manager approval workflows.

## Features

### Core Functionality
- **Project-Based Time Logging**: Employees can log time against specific projects created by managers
- **Detailed Time Entries**: Track hours worked with descriptions, task categories, and billable status
- **Weekly Submissions**: Submit timesheets for manager approval on a weekly basis
- **Manager Approval**: Managers can review and approve/reject timesheet submissions
- **Real-time Tracking**: Live display of current week's hours and entries
- **Project Integration**: Seamless integration with existing project management system

### User Interface
- **Timesheet Card**: Main interface on employee dashboard
- **Add Entry Modal**: Clean form for logging time with project selection
- **Submission Modal**: Weekly timesheet submission with summary
- **Status Tracking**: Visual indicators for draft, submitted, and approved statuses
- **Project Selection**: Dropdown of available projects created by managers

## Technical Implementation

### Database Schema
- **timesheet_entries table**: Stores individual time entries with project relationships
- **timesheet_submissions table**: Manages weekly submissions and approval workflow
- **Automatic calculations**: Total hours calculated via database functions
- **Row Level Security**: Users can only access their own timesheet data
- **Manager oversight**: Managers can view and approve team timesheets

### Backend Functions
- `get_available_projects_for_user()`: Returns active projects available for time logging
- `get_timesheet_summary()`: Provides summary statistics for time tracking
- `submit_timesheet()`: Handles weekly timesheet submission
- `approve_timesheet()`: Manager approval workflow

### Frontend Components
- `TimesheetCard`: Main UI component for timesheet management
- `TimesheetEntryModal`: Form for adding new time entries
- `TimesheetSubmissionModal`: Weekly submission interface
- Form validation using Zod schemas
- React Hook Form for form management

## Files Added/Modified

### New Files
1. `timesheet-schema.sql` - Database schema and functions
2. `src/lib/timesheet.ts` - Backend API functions
3. `src/components/dashboard/timesheet-card.tsx` - Main timesheet UI
4. `src/components/dashboard/timesheet-entry-modal.tsx` - Add entry form
5. `src/components/dashboard/timesheet-submission-modal.tsx` - Submission form
6. `test-timesheet.sql` - Database testing script

### Modified Files
1. `src/lib/validations.ts` - Added timesheet validation schemas
2. `src/lib/database.types.ts` - Added timesheet types
3. `src/components/dashboard/employee-dashboard.tsx` - Integrated timesheet card

## Setup Instructions

### 1. Database Setup
Run the SQL schema file to create the timesheet infrastructure:
```sql
-- Execute timesheet-schema.sql in your Supabase SQL editor
```

### 2. Verify Installation
Run the test script to ensure everything is working:
```sql
-- Execute test-timesheet.sql in your Supabase SQL editor
```

### 3. Frontend Integration
The timesheet card will automatically appear on the employee dashboard once the database schema is applied.

## Usage

### For Employees
1. Navigate to the dashboard
2. Locate the "Timesheet" card
3. Click "Add Entry" to log time against a project
4. Select project, date, hours, and add description
5. Choose task category and billable status
6. Submit weekly timesheet for manager approval

### For Managers
1. View team timesheet submissions in manager dashboard
2. Review individual time entries and project allocations
3. Approve or reject timesheet submissions
4. Monitor team productivity and project time allocation

### Features Available
- **Project Selection**: Choose from active projects created by managers
- **Time Logging**: Log hours with detailed descriptions and categories
- **Weekly Submissions**: Submit timesheets for approval
- **Status Tracking**: Monitor submission and approval status
- **Billable Tracking**: Mark time as billable or non-billable
- **Task Categories**: Categorize work (development, testing, meetings, etc.)

## Data Model

### Timesheet Entries
- **Project Association**: Each entry is linked to a specific project
- **Time Tracking**: Hours worked with decimal precision
- **Description**: Detailed work description
- **Task Category**: Classification of work type
- **Billable Status**: Whether time is billable to client
- **Status**: Draft, submitted, approved, or rejected

### Timesheet Submissions
- **Weekly Aggregation**: Groups entries by week
- **Total Hours**: Calculated sum of all entries
- **Submission Status**: Draft, submitted, approved, or rejected
- **Approval Workflow**: Manager review and approval process

## Security Features

### Row Level Security (RLS)
- Users can only view and edit their own timesheet entries
- Managers can view and approve their team members' timesheets
- Admins have full access to all timesheet data

### Data Validation
- Zod schemas validate all form inputs
- Database constraints prevent invalid data
- Server-side validation in all API functions
- Minimum/maximum hour limits per entry

## Error Handling

### Client-side
- Form validation with user-friendly error messages
- Loading states during API calls
- Graceful error handling with user notifications
- Duplicate entry prevention

### Server-side
- Comprehensive error logging
- Meaningful error messages returned to client
- Database constraint validation
- Transaction safety for submissions

## Performance Considerations

### Database
- Indexed columns for fast queries
- Efficient RLS policies
- Optimized functions for common operations
- Proper foreign key relationships

### Frontend
- Efficient state management
- Minimal re-renders
- Lazy loading of project data
- Optimized form handling

## Integration with Existing Features

### Project Management
- Seamless integration with manager-created projects
- Real-time project status updates
- Project priority and status display
- Automatic project availability filtering

### Time Tracking
- Complements existing clock in/out functionality
- Separate from daily time tracking
- Project-specific time allocation
- Detailed work categorization

## Future Enhancements

### Potential Features
- Time tracking reports and analytics
- Integration with payroll systems
- Mobile app support
- Bulk time entry import
- Time tracking templates
- Client billing integration
- Overtime calculations
- Time tracking reminders

### Technical Improvements
- Real-time updates via WebSockets
- Advanced reporting dashboard
- Export functionality (PDF, Excel)
- Time tracking analytics
- Integration with calendar systems
- Automated time tracking suggestions

## Testing

### Manual Testing
1. Create timesheet entries for different projects
2. Test form validation and error handling
3. Submit weekly timesheet and verify status
4. Test manager approval workflow
5. Verify RLS policies work correctly
6. Test project availability filtering

### Database Testing
Use the provided `test-timesheet.sql` script to verify:
- Table structure and relationships
- Function existence and functionality
- RLS policies and security
- Data integrity and constraints

## Troubleshooting

### Common Issues
1. **No projects available**: Check if manager has created active projects
2. **Cannot submit timesheet**: Verify all entries are in draft status
3. **Permission denied**: Check RLS policies and user roles
4. **Form validation errors**: Verify input data meets requirements

### Debug Steps
1. Check browser console for errors
2. Verify database functions exist
3. Check RLS policies are enabled
4. Verify user authentication and roles
5. Check network requests in dev tools
6. Review database logs in Supabase dashboard

## Support

For technical issues or questions about the timesheet feature, refer to:
- Database logs in Supabase dashboard
- Browser console for frontend errors
- Network tab for API call debugging
- This documentation for setup and usage
- Test scripts for functionality verification

---

Built with ❤️ using Next.js, TypeScript, Supabase, and React Hook Form
