# Expense Management Feature

## Overview

The Expense Management feature allows employees to submit expenses for approval and managers to review and approve/reject those expenses. This feature integrates seamlessly with the existing HR portal architecture.

## Features

### For Employees
- **Submit Expenses**: Create new expense submissions with category, amount, description, and receipt
- **View Expense History**: Track all submitted expenses with status updates
- **Expense Categories**: Choose from predefined expense categories with limits
- **Receipt Management**: Upload receipt URLs for expense validation
- **Real-time Status**: See approval status and manager comments

### For Managers
- **Review Team Expenses**: View all team member expense submissions
- **Approve/Reject Expenses**: Make decisions on expense approvals with comments
- **Team Expense Overview**: Dashboard showing team expense statistics
- **Expense Comments**: Add internal and external comments for communication
- **Bulk Review**: Efficiently review multiple expenses with filtering

## Database Schema

### Tables Created

1. **expense_categories**
   - Stores predefined expense categories
   - Includes max amount limits and receipt requirements
   - Supports active/inactive status

2. **expenses**
   - Main expense records
   - Links to employee, manager, and category
   - Tracks approval status and comments
   - Includes receipt URL and amount validation

3. **expense_comments**
   - Communication between employees and managers
   - Supports internal (manager-only) comments
   - Links to specific expenses

### Security (RLS Policies)

- **Employees**: Can only view and create their own expenses
- **Managers**: Can view their own expenses and their team members' expenses
- **Admins**: Full access to all expense data
- **Categories**: Public read access for active categories

## API Endpoints

### Expense Management
- `POST /api/expenses` - Create new expense
- `GET /api/expenses?employeeId={id}` - Get employee expenses
- `GET /api/expenses?managerId={id}` - Get manager team expenses
- `POST /api/expenses/{id}/approve` - Approve/reject expense

### Categories
- `GET /api/expense-categories` - Get active expense categories

## Frontend Components

### Employee Components
- `ExpenseSubmissionForm` - Form for submitting new expenses
- `EmployeeExpenseList` - List of employee's expense history
- `ExpenseSummaryCard` - Dashboard summary card

### Manager Components
- `ManagerExpenseApproval` - Interface for reviewing team expenses
- `ExpenseSummaryCard` - Manager dashboard summary

### Shared Components
- `ExpenseSummaryCard` - Reusable summary component for both roles

## Integration Points

### Dashboard Integration
- Added "Expenses" navigation item to both employee and manager sidebars
- Integrated expense summary cards into main dashboards
- Added expense management page at `/dashboard/expenses`

### Navigation
- **Employee Sidebar**: Added between "My Tasks" and "Leave"
- **Manager Sidebar**: Added between "Time Tracking" and "Leave"

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── expenses/
│   │   │   ├── route.ts                    # Main expense API
│   │   │   └── [id]/approve/route.ts       # Approval API
│   │   └── expense-categories/route.ts     # Categories API
│   └── dashboard/
│       └── expenses/page.tsx               # Main expense page
├── components/
│   └── expense/
│       ├── expense-submission-form.tsx     # Employee submission form
│       ├── employee-expense-list.tsx       # Employee expense list
│       ├── manager-expense-approval.tsx    # Manager approval interface
│       └── expense-summary-card.tsx        # Dashboard summary card
└── lib/
    ├── expenses.ts                         # Expense management functions
    ├── validations.ts                      # Zod validation schemas
    └── database.types.ts                   # Updated with expense types
```

## Validation Rules

### Expense Submission
- **Category**: Required, must be active
- **Title**: 2-100 characters
- **Description**: 10-500 characters
- **Amount**: 0.01-999,999.99, must be positive
- **Date**: Required, cannot be in the future
- **Receipt**: Optional URL, validated if provided

### Approval
- **Status**: Must be "approved" or "rejected"
- **Comment**: Optional, max 500 characters

## Default Categories

The system comes with predefined expense categories:

1. **Travel** - Business travel (max $5,000, receipt required)
2. **Meals** - Business meals (max $200, receipt required)
3. **Transportation** - Local transport (max $100, receipt required)
4. **Office Supplies** - Office materials (max $500, receipt required)
5. **Training** - Professional development (max $2,000, receipt required)
6. **Software** - Software licenses (max $1,000, receipt required)
7. **Communication** - Phone/internet (max $200, receipt required)
8. **Other** - Miscellaneous (max $1,000, receipt required)

## Testing

### Database Testing
Run `test-expense-management.sql` in Supabase SQL editor to:
- Create test data
- Verify database functionality
- Test RLS policies
- Validate queries

### Manual Testing Workflow

1. **Employee Submission**:
   - Navigate to `/dashboard/expenses`
   - Click "Submit Expense"
   - Fill out form with valid data
   - Submit and verify success

2. **Manager Approval**:
   - Login as manager
   - Navigate to `/dashboard/expenses`
   - View "Team Expenses" tab
   - Review pending expenses
   - Approve/reject with comments

3. **Dashboard Integration**:
   - Verify expense summary cards appear
   - Check navigation links work
   - Test responsive design

## Security Considerations

- **Authentication**: All API endpoints require valid user session
- **Authorization**: RLS policies enforce role-based access
- **Input Validation**: Zod schemas validate all inputs
- **SQL Injection**: Parameterized queries prevent injection
- **XSS Protection**: React's built-in XSS protection

## Performance Optimizations

- **Database Indexes**: Added indexes on frequently queried columns
- **Pagination**: Large expense lists can be paginated
- **Caching**: Expense categories cached on client side
- **Lazy Loading**: Components load data only when needed

## Future Enhancements

### Potential Improvements
1. **File Upload**: Direct receipt file upload instead of URLs
2. **Bulk Operations**: Bulk approve/reject multiple expenses
3. **Expense Reports**: Generate PDF/Excel reports
4. **Budget Tracking**: Track department/team budgets
5. **Approval Workflows**: Multi-level approval chains
6. **Mobile App**: Native mobile application
7. **Integration**: Connect with accounting systems
8. **Analytics**: Advanced expense analytics and insights

### Configuration Options
1. **Custom Categories**: Allow admins to create custom categories
2. **Approval Limits**: Set different approval limits by role
3. **Notification Settings**: Email/SMS notifications for status changes
4. **Approval Deadlines**: Set deadlines for expense approvals

## Troubleshooting

### Common Issues

1. **Expense Not Submitting**:
   - Check validation errors
   - Verify user authentication
   - Check database connection

2. **Manager Can't See Team Expenses**:
   - Verify manager-employee relationship
   - Check RLS policies
   - Confirm user role

3. **Categories Not Loading**:
   - Check if categories are marked as active
   - Verify API endpoint accessibility
   - Check network connectivity

### Debug Steps

1. Check browser console for errors
2. Verify API responses in Network tab
3. Check Supabase logs for database errors
4. Validate user permissions and roles
5. Test with different user accounts

## Deployment Notes

### Database Migration
1. Run `expense-management-schema.sql` in Supabase
2. Verify all tables and policies are created
3. Test RLS policies with different user roles
4. Run test queries to validate functionality

### Environment Variables
No additional environment variables required - uses existing Supabase configuration.

### Dependencies
All dependencies are already included in the existing project:
- React Hook Form
- Zod validation
- Supabase client
- Lucide React icons
- Tailwind CSS

## Support

For issues or questions regarding the expense management feature:
1. Check this documentation first
2. Review the test file for expected behavior
3. Check browser console and network logs
4. Verify database schema and RLS policies
5. Test with different user roles and permissions
