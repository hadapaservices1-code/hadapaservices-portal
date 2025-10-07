# Company Portal

A world-class company portal built with Next.js, TypeScript, Tailwind CSS, and Supabase. This portal provides role-based access with separate dashboards for employees and managers.

## Features

### 🔐 Authentication
- **Login/Signup** with email and password
- **Role-based access** (Employee, Manager, Admin)
- **Form validation** using React Hook Form and Zod
- **Secure authentication** powered by Supabase Auth

### 👥 Employee Dashboard
- **Personal overview** with task completion stats
- **Task management** with status tracking
- **Schedule view** with upcoming events
- **Announcements** and company updates
- **Modern, responsive UI** with beautiful gradients

### 👨‍💼 Manager Dashboard
- **Team management** with member status tracking
- **Analytics overview** with productivity metrics
- **Project deadlines** and task monitoring
- **Team activity feed** with real-time updates
- **Quick actions** for team management

### 🏗️ Architecture
- **Component-based** design for easy feature additions
- **TypeScript** for type safety
- **Tailwind CSS** for consistent styling
- **Supabase** for backend and database
- **Role-based routing** with middleware protection

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **Backend**: Supabase (Auth, Database, Real-time)
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd company-portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Settings > API to get your project URL and anon key
   - Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up the database**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run the SQL commands from `supabase-schema.sql`

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Schema

The application uses the following main tables:

### `profiles`
- User profiles with role-based access
- Fields: id, email, full_name, role, department, position, avatar_url, manager_id

### `departments`
- Company departments
- Fields: id, name, description

### User Roles
- **Employee**: Access to personal dashboard and tasks
- **Manager**: Access to team management and analytics
- **Admin**: Full system access

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard components
│   └── ui/               # Reusable UI components
├── lib/                  # Utility functions
│   ├── supabase.ts       # Supabase client
│   ├── validations.ts    # Zod schemas
│   └── utils.ts          # Helper functions
└── middleware.ts         # Route protection
```

## Features in Detail

### Authentication Flow
1. Users can sign up with email, password, and role selection
2. Profile is automatically created upon successful signup
3. Login redirects to appropriate dashboard based on role
4. Middleware protects routes and handles authentication state

### Employee Dashboard
- **Stats Cards**: Task completion, hours worked, pending tasks
- **Recent Tasks**: List of current tasks with status and priority
- **Upcoming Events**: Calendar integration with meetings and deadlines
- **Announcements**: Company-wide updates and notifications

### Manager Dashboard
- **Team Overview**: Team member status and workload
- **Analytics**: Productivity metrics and performance insights
- **Quick Actions**: Add team members, create projects, schedule meetings
- **Activity Feed**: Real-time updates from team members
- **Deadline Tracking**: Project deadlines with status indicators

## Customization

### Adding New Features
The component-based architecture makes it easy to add new features:

1. **Create new components** in the appropriate directory
2. **Add new routes** in the app directory
3. **Update the sidebar** navigation if needed
4. **Add database tables** and update the schema

### Styling
- Uses Tailwind CSS with custom design system
- Components are built with Radix UI primitives
- Consistent color scheme and spacing
- Responsive design for all screen sizes

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms
The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.

---

Built with ❤️ using Next.js, TypeScript, and Supabase