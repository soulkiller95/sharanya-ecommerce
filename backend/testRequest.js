const http = require('http');
const data = JSON.stringify({name:'Test User',email:'testuser@example.com',password:'password123',confirmPassword:'password123'});
const options = {hostname:'localhost',port:5000,path:'/api/auth/register',method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(data)}};
const req = http.request(options,res=>{let body='';res.on('data',chunk=>body+=chunk);res.on('end',()=>{console.log('status',res.statusCode);console.log(body);});});
req.on('error',console.error);
req.write(data);req.end();
