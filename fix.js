const fs=require('fs');const d=fs.readFileSync('src/app/globals.css','utf8');fs.writeFileSync('src/app/globals.css', d.replace(/([a-zA-Z0-9_-]+):\s+!/g, (m,p1)=>p1+':!'));
