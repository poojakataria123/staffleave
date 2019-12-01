const express = require('express');
const bodyparser = require('body-parser');
const mysql = require('mysql')
const cookieParser = require('cookie-parser');
const session = require('express-session');
const dbconn = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'hello@world',
    database:'leave_management'
}); 

dbconn.connect(function(err){
    if (err){
        console.log("Error connecting to database",err);
        throw err;
    }
    else{
        console.log("Connected to database");
    }
});
const app=express();
app.set('view engine','ejs');
app.use(express.static('public'));
app.use(bodyparser.urlencoded({extended:false}));
app.use(cookieParser());
app.use(session({
    key: 'user_sid',
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));

const server=app.listen(4000,function(){
	console.log("Listening to request on port 4000");
});

app.get("/",function(req,res){
    let sql = null;
    if(req.session.user && req.session.user.type == "user")
        sql = "select * from users where user_name = '" + req.session.user.username + "' and password = '" + req.session.user.password + "';";
     
         else if(req.session.user && req.session.user.type == "hod")
        sql = "select * from hod where user_name = '" + req.session.user.username + "' and password = '" + req.session.user.password + "';";
    console.log("serving home page");
    if(!sql){
        res.sendFile(__dirname+"/public/index1.html");
    }
    else{
        dbconn.query(sql,function(err,result){
            console.log("serving home page",result);
            if(result.length){
                if(req.session.user.type == "user")
                    res.redirect("/dashboard");
                else
                    res.redirect("/hod/home");
            }
            else{
                res.sendFile(__dirname+"/public/index1.html");
            }
        });
    }
});

app.get("/hod",function(req,res){
    console.log("opened hod portal");
    res.sendFile(__dirname+"/public/hod.html");
});

app.get("/dashboard",function(req,res){
    console.log("dashbard request",req.session.user);
    if(req.session.user && req.cookies.user_sid && req.session.user.type == "user"){
        res.render("user",req.session.user);
    }
    else if(req.session.user && req.cookies.user_sid && req.session.user.type == "hod"){
        res.redirect("/hod/home");
    }
    else{
        res.redirect("/");
    }
});

app.get("/hod/home",function(req,res){
    console.log("home page hod");
    if(req.session.user && req.session.user.type == "hod"){
        res.end("hod home page");
    }
    else{
        res.redirect("/");
    }
});

app.get("/signup_user",function(req,res){
    res.sendFile(__dirname+"/public/signup.html");
});

app.get("/hod/signup",function(req,res){
    res.sendFile(__dirname+"/public/register_hod.html");
});

app.post("/register_hod",function(req,res){
    let sql = "select * from hod  where user_name = '" + req.body.username + "';";
    dbconn.query(sql,function(err,result){
        if(err){
            console.log(err);
            throw err;
            res.redirect('/');
        }
        else{
            if(result.length>0){
                console.log("user already exists");
                res.redirect('/');
            }
            else{
                req.session.user = {username: req.body.username, password: req.body.password};
                let sql = "insert into hod values('" + req.body.username + "','"+ req.body.password + "','"+req.body.email+"',"+req.body.contacts+");";
                dbconn.query(sql,function(err,result){
                    if(err){
                        console.log("Error for signing up hod ",sql);
                        res.redirect("/");
                    }
                    else{
                        console.log("successfully signed up " + req.body.username);
                   
                        req.session.user = {username: req.body.username, password: req.body.password, type: "user"};
                        console.log(req.session.user);
                        res.redirect('/dashboard');
                    }
                });
            }
        }
    });
});

app.post("/login",function(req,res){
    let sql = "select * from users where user_name = '" + req.body.username + "' and password = '" + req.body.password + "';";
    console.log("login query: "+sql);
    dbconn.query(sql,function(err,result){
        if(result.length){
            console.log(result[0]);
            console.log("logged in");
            req.session.user = {username: req.body.username, password: req.body.password, type: "user"};
            res.redirect("/dashboard");        
        }
        else{
            console.log("wrong username or password");
            res.redirect("/");
        }
    });
});


app.post("/hod/login",function(req,res){
    console.log("logging in hod");
    let sql = "select * from hod where user_name = '" + req.body.username + "' and password = '" + req.body.password + "';";
    dbconn.query(sql,function(err,result){
        if(result.length){
            req.session.user = {username: req.body.username, password: req.body.password, type: "hod"};
            res.redirect("/hod/home");
        }
        else{
            res.redirect("/hod");
        }
    });
});

app.get("/contact",function(req,res){
    if(req.session.user && req.cookies.user_sid){
        let sql = null;
        if(req.session.user.type == "user"){
            sql = "select * from users where user_name = '" + req.session.user.username + "' and password = '" + req.session.user.password +"';";
            console.log("contact from user");
        }
        else{
            sql = "select * from hod where user_name = '" + req.session.user.username + "' and password = '" + req.session.user.password +"';";
            console.log("contact from hod");
        }
        if(!sql)
            res.redirect("/");
        else{
            dbconn.query(sql,function(err,result){
                console.log("contact query",sql);
                if(result.length)
                    res.render("contact",result[0]);
                else
                    res.redirect("/");
            });
        }
    }
    else
        res.redirect("/");
});

app.get("/leave_request",function(req,res){
    res.render("leave_request",req.query);
});

app.get("/user/leave_request",function(req,res){
    if(req.session.user && req.session.user.type == "user"){
        let sql = "select * from leaves where user_name='"+req.session.user.username+"' order by date;";
        dbconn.query(sql,function(err,result){
            if(err){
                res.redirect("/dashboard");
            }
            else{
                res.render("user_leaves",{leave:result});
            }
        });
    }
});

app.get("/search_results",function(req,res){
    console.log(req.query);
    if(!req.session.user || !req.cookies.user_sid)
        res.redirect("/");
});

app.get("/leave",function(req,res){
    if(req.session.user && req.cookies.user_sid){
        res.render("make_leaves",{user: req.session.user.username, hod: req.query.username});
    }
    else
        res.redirect("/");
});
 
app.post("/make_leaves",function(req,res){
    let sql = "insert into leaves values('" + req.body.hod + "','" + req.body.user + "','" + req.body.function_type + "','" + req.body.album_type + "','" + req.body.album_theme + "','" + req.body.date + "','" + req.body.time + "','" + req.body.venue1 + "','" + req.body.venue2 + "','" + req.body.venue3 + "','pending');";
    dbconn.query(sql,function(err,result){
        console.log(sql);
        if(err){
            res.redirect("/");
        }
        else{
            res.send("Confirmed leave");
        }
    });
});



app.get("/hod/confirm_leaves",function(req,res){
    if(req.session.user && req.session.user.type == "hod"){
        let user = req.query.user;
        let function_type = req.query.function_type;
        let sql = "update leaves set status = 'confirmed' where user_name='" + user + "' and hod='" + req.session.user.username + "' and function_type='" + function_type + "';";
        console.log("status update query");
        console.log(sql);
        dbconn.query(sql,function(err,result){
            if(err){
                res.redirect("hod/home");
            }
            else{
                res.send("confirmed leave");
            }
        });
    }
    else{
        res.redirect("/hod");
    }
});

app.post("/register_user", function(req,res){
    sql = "insert into users values ('"+req.body.username+"','"+req.body.password+"','"+req.body.designation+"','"+req.body.email+"', date '"+req.body.dob+"','"+req.body.address+"',"+req.body.contacts+");";
    dbconn.query(sql, function(err,result){
        if(err){
            console.log("error in sql query ",sql);
            res.redirect("/");
        }
        else{
            console.log("successfully signed up user");
            res.redirect('/');
        }
    });
});

app.get("/logout",function(req,res){
    if(req.session.user && req.cookies.user_sid){
        req.session.destroy();
        res.clearCookie('user_sid');
    }
    res.redirect("/");
});