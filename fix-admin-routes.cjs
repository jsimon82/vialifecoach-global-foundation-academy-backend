const fs = require('fs');

// Read current admin routes
const routesContent = fs.readFileSync('./src/routes/admin.routes.js', 'utf8');

// Fix the typo: applications -> applications
const fixedContent = routesContent
  .replace(/adminRouter\.get\("\/admin\/applications"/g, 'adminRouter.get("/admin/applications"')
  .replace(/adminRouter\.post\("\/admin\/applications/g, 'adminRouter.post("/admin/applications');

// Write the fixed content
fs.writeFileSync('./src/routes/admin.routes.js', fixedContent);

console.log('✅ Fixed typo in admin routes: applications -> applications');
