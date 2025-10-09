// Test script to verify team API functionality
// Run this in your browser console on the dashboard page

async function testTeamAPI() {
  console.log('Testing Team API...');
  
  try {
    // Test if the team functions are available
    const { getTeamMembers, getTeamStats, getRecentTeamActivities, getUpcomingDeadlines } = await import('/src/lib/team.ts');
    
    console.log('✅ Team API functions imported successfully');
    
    // Test with a sample manager ID (replace with actual manager ID)
    const managerId = '59d3683b-b83e-47d4-9dcc-a3a27e2e42bd'; // From your terminal logs
    
    console.log('Testing with manager ID:', managerId);
    
    // Test each function
    const [members, stats, activities, deadlines] = await Promise.allSettled([
      getTeamMembers(managerId),
      getTeamStats(managerId),
      getRecentTeamActivities(managerId),
      getUpcomingDeadlines(managerId)
    ]);
    
    console.log('Team Members:', members);
    console.log('Team Stats:', stats);
    console.log('Recent Activities:', activities);
    console.log('Upcoming Deadlines:', deadlines);
    
    console.log('✅ Team API test completed');
    
  } catch (error) {
    console.error('❌ Team API test failed:', error);
  }
}

// Run the test
testTeamAPI();
