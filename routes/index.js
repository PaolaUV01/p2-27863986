const express = require('express');
const router = express.Router();
const sqlite3=require('sqlite3').verbose();
const path = require('path');
const fetch = require('node-fetch')
const nodemailer = require("nodemailer");
require('dotenv').config()

const basededatos=path.join(__dirname,"BD","BD.db");
const bd=new sqlite3.Database(basededatos, err =>{ 
if (err){
	return console.error(err.message);
}else{
	console.log("db only");
}
})

const create="CREATE TABLE IF NOT EXISTS contactos(email VARCHAR(20),nombre VARCHAR(20), comentario TEXT,fecha DATATIME,ip TEXT,country_cli VARCHAR(15));";

bd.run(create,err=>{
	if (err){
	return console.error(err.message);
}else{
	console.log("table only");
}
})

router.get('/contactos',(req,res)=>{
	const sql="SELECT * FROM contactos;";
	bd.all(sql, [],(err, rows)=>{
			if (err){
				return console.error(err.message);
			}else{
			res.render("contactos.ejs",{obtener:rows});
			}
	})
})

router.post('/',(req,res)=>{
	var diadehoy = new Date();
  	var horas = diadehoy.getHours();
  	var minutos = diadehoy.getMinutes();
  	var segundos = diadehoy.getSeconds()
  	var hora = horas + ':' + minutos + ':' + segundos + ' '
  	var fecha = diadehoy.getDate() + '-' + ( diadehoy.getMonth() + 1 ) + '-' + diadehoy.getFullYear() + '//' + hora;
	var IP_GET = req.headers["x-forwarded-for"]
	if (IP_GET){
		var list = IP_GET.split(",");
		IP_GET= list[list.length-1];
	} else {
		console.log('null')
    }
	let COUNTRY_GET;
  	const required = req.body['g-recaptcha-response']
	const private = process.env.RE_KEY;
	const url = `https://www.google.com/recaptcha/api/siteverify?secret=${private}&response=${required}`;
	fetch(url, {
    method: 'post',
 	})
    .then((response) => response.json())
    .then((google_response) => {
      if (google_response.success == true) {		
		console.log('Captcha verificado');
	  	fetch('http://www.geoplugin.net/json.gp?ip=' + IP_GET)
	 	.then(response => response.json())
	  	.then(json => {COUNTRY_GET = json.geoplugin_countryName
			const sql="INSERT INTO contactos(nombre, email, comentario, fecha ,ip,country_cli) VALUES (?,?,?,?,?,?)";
			const nuevos_mensajes=[req.body.nombre, req.body.email, req.body.comentario,fecha,IP_GET,COUNTRY_GET];
			bd.run(sql, nuevos_mensajes, err =>{
			if (err){
				return console.error(err.message);
			}
			else{
				res.redirect("/");
				}
			})
			var transporter = nodemailer.createTransport({
				host: "smtp-mail.outlook.com",
				secureConnection: false,
				port: 587, 
				tls: {
				   ciphers:'SSLv3'
				},
				auth: {
					user: process.env.CO_PRIVADO,
					pass: process.env.CON_PRIV
				}
			});

			var mailOptions = {
				from: process.env.CORREOPRIVADO,
				to: 'programacion2ais@dispostable.com', 
				subject: 'Programacion p2 ', 
				text: 'Task 3 ', 
				html:  `<p>Nombre: ${req.body.nombre}<p>
						<p>Email: ${req.body.email}<p>
						<p>Mensaje: ${req.body.comentario}
						<p>Fecha: ${fecha}
						<p>Pais: ${COUNTRY_GET}
						<P>ip: ${IP_GET}`  
			};
			
			transporter.sendMail(mailOptions, function(error, info){
				if(error){
					return console.log(error);
				}
				console.log('Message sent');
			});
	 }
 	);
      } else {
		  console.log('Captcha no verificado')
		  res.redirect('/');
        
      }
    })
    .catch((error) => {
      return res.json({ error })
    })
})
  	
		





router.get('/',(req,res)=>{
	res.render('index.ejs',{obtener:{}})
});



module.exports = router;








