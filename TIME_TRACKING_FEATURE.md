# Time Tracking Feature

## Overview
A comprehensive time in/out feature for employees to track their daily work hours. This feature integrates seamlessly with the existing employee dashboard and provides real-time tracking capabilities.

## Features

### Core Functionality
- **Clock In/Out**: Employees can clock in and out with optional notes
- **Real-time Status**: Live display of current clock status and session duration
- **Daily Hours Tracking**: Automatic calculation of total hours worked per day
- **Weekly Summary**: Display of total hours worked in the current week
- **Session Duration**: Real-time display of current work session duration

### User Interface
- **Time Tracking Card**: Prominent card on employee dashboard
- **Modal Dialogs**: Clean clock in/out forms with validation
- **Status Indicators**: Visual indicators for clocked in/out status
- **Auto-refresh**: Data refreshes every minute automatically
- **Manual Refresh**: Users can manually refresh their time data

## Technical Implementation

### Database Schema
- **time_tracking table**: Stores all time tracking records
- **Automatic calculations**: Total hours calculated via database triggers
- **Row Level Security**: Users can only access their own time records
- **Unique constraints**: One record per user per day

### Backend Functions
- `get_current_time_status()`: Returns current clock status and today's hours
- `clock_in()`: Handles clock in with validation
- `clock_out()`: Handles clock out with validation
- `calculate_total_hours()`: Automatic trigger for hour calculations

### Frontend Components
- `TimeTrackingCard`: Main UI component for time tracking
- Form validation using Zod schemas
- React Hook Form for form management
- Real-time updates and status display

## Files Added/Modified

### New Files
1. `time-tracking-schema.sql` - Database schema and functions
2. `src/lib/time-tracking.ts` - Backend API functions
3. `src/components/dashboard/time-tracking-card.tsx` - UI component
4. `test-time-tracking.sql` - Database testing script

### Modified Files
1. `src/lib/validations.ts` - Added time tracking validation schemas
2. `src/lib/database.types.ts` - Added time tracking types
3. `src/components/dashboard/employee-dashboard.tsx` - Integrated time tracking card
4. `src/app/dashboard/page.tsx` - Pass userId to employee dashboard

## Setup Instructions

### 1. Database Setup
Run the SQL schema file to create the time tracking infrastructure:
```sql
-- Execute time-tracking-schema.sql in your Supabase SQL editor
```

### 2. Verify Installation
Run the test script to ensure everything is working:
```sql
-- Execute test-time-tracking.sql in your Supabase SQL editor
```

### 3. Frontend Integration
The time tracking card will automatically appear on the employee dashboard once the database schema is applied.

## Usage

### For Employees
1. Navigate to the dashboard
2. Locate the "Time Tracking" card
3. Click "Clock In" to start your work day
4. Add optional notes about your tasks
5. Click "Clock Out" when finished
6. Add notes about accomplishments

### Features Available
- **Current Status**: See if you're currently clocked in or out
- **Session Duration**: Real-time display of current work session
- **Today's Hours**: Total hours worked today
- **Weekly Hours**: Total hours worked this week
- **Notes**: Add context to your clock in/out times

## Security Features

### Row Level Security (RLS)
- Users can only view their own time tracking records
- Managers can view their team members' time records
- Admins have full access to all records

### Data Validation
- Zod schemas validate all form inputs
- Database constraints prevent invalid data
- Server-side validation in all API functions

## Error Handling

### Client-side
- Form validation with user-friendly error messages
- Loading states during API calls
- Graceful error handling with user notifications

### Server-side
- Comprehensive error logging
- Meaningful error messages returned to client
- Database constraint validation

## Performance Considerations

### Database
- Indexed columns for fast queries
- Efficient RLS policies
- Optimized functions for common operations

### Frontend
- Auto-refresh every minute (configurable)
- Efficient state management
- Minimal re-renders

## Future Enhancements

### Potential Features
- Break time tracking
- Overtime calculations
- Time tracking reports
- Manager approval workflows
- Integration with payroll systems
- Mobile app support

### Technical Improvements
- Real-time updates via WebSockets
- Offline support with sync
- Advanced reporting dashboard
- Export functionality

## Testing

### Manual Testing
1. Clock in and verify status updates
2. Clock out and verify hours calculation
3. Test form validation
4. Verify RLS policies work correctly
5. Test refresh functionality

### Database Testing
Use the provided `test-time-tracking.sql` script to verify:
- Table structure
- Function existence
- RLS policies
- Data integrity

## Troubleshooting

### Common Issues
1. **Clock in fails**: Check if already clocked in today
2. **Hours not calculating**: Verify time_out is set
3. **Permission denied**: Check RLS policies
4. **UI not updating**: Check network connection and refresh

### Debug Steps
1. Check browser console for errors
2. Verify database functions exist
3. Check RLS policies are enabled
4. Verify user authentication
5. Check network requests in dev tools

## Support

For technical issues or questions about the time tracking feature, refer to:
- Database logs in Supabase dashboard
- Browser console for frontend errors
- Network tab for API call debugging
- This documentation for setup and usage
