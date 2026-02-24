import fetch from 'node-fetch';

(async () => {
  const payload = {name:'Alice',email:'alice@example.com',subject:'Help!',message:'I need assistance'};
  const res = await fetch('http://localhost:5500/api/v1/support/ticket', {
    method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)
  });
  console.log(res.status, await res.text());

  const res2 = await fetch('http://localhost:5500/api/v1/support/booking', {
    method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)
  });
  console.log(res2.status, await res2.text());
})();
