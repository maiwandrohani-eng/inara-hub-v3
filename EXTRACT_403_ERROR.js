// Run this in your browser console to extract 403 error details
// After getting a 403 error, run this:

// Method 1: Expand the error object
// In the console, click on the error object (Z {message: 'Request failed...'})
// Expand it and look for:
//   - response.data
//   - response.status
//   - config.url

// Method 2: Run this script to catch the next error
window.last403Error = null;

// Override console.error temporarily to catch 403 errors
const originalError = console.error;
console.error = function(...args) {
  originalError.apply(console, args);
  if (args[0]?.response?.status === 403 || args[0]?.response?.data) {
    window.last403Error = args[0];
    console.log('=== CAUGHT 403 ERROR ===');
    console.log('Error object:', args[0]);
    console.log('Response data:', args[0]?.response?.data);
  }
};

// Method 3: Check the error after it happens
// After the error, run:
// error.response?.data

// Method 4: Add a global error handler
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.response?.status === 403) {
    console.log('=== UNHANDLED 403 ERROR ===');
    console.log('Full error:', event.reason);
    console.log('Response data:', event.reason?.response?.data);
    console.log('User role (server):', event.reason?.response?.data?.userRole);
    console.log('Required roles:', event.reason?.response?.data?.requiredRoles);
  }
});

console.log('✅ Error catcher installed. Try the bulk import again and check the console.');
