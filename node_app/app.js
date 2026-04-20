const express = require('express'); // for api framework
const cors = require('cors');
const app = express();
const env = process.env
const mongoose = require('mongoose');
const dotenv = require("dotenv");
dotenv.config();
const fileUpload = require('express-fileupload');
const _ = require("lodash");
const { jwtMiddleware } = require('./app/helpers/validation');
const cwd = process.cwd();



const authRoutes = require('./app/routes/auth');
const masterRoutes = require('./app/routes/master');
const mainRoutes = require('./app/routes/main');
const supplierRoutes = require('./app/routes/supplier');
const bulkupdateRoutes = require('./app/routes/bulk_update');
const migrationRoutes = require('./app/routes/migration');

mongoose.set('strictQuery', true);
// mongoose.connect(env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connect('mongodb://localhost:27017/medquantas', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log('MongoDB connected successfully');
    })
    .catch((error) => {
        console.error('MongoDB connection error:', error);
    });
app.use(fileUpload());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({
    extended: true, limit: '10mb'
}));

app.use(cors());

app.use(express.static(cwd + '/media'));
const path = require('path');
app.use(express.static(path.join(__dirname, 'media')));


app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, PATCH, DELETE');
        return res.status(200).json({});
    }
    next();
});

app.use(jwtMiddleware);

app.use((req, res, next) => {
    res.apiResponse = async (status, message, data = null) => {
        var message = _(message);
        res.send({
            status,
            message,
            data,
        })
        return res.end()
    }

    if (req.method === 'GET') {
        return next();
    }

    var contype = req.headers['content-type'];

    if ((!contype || contype.indexOf('multipart/form-data') !== 0) && !req.body.params) {
        return res.apiResponse(false, "Params is required")
    }
    var params = req.body.params

    if ((typeof params).toLowerCase() !== 'object') {
        try {
            if (params != undefined) {
                params = JSON.parse(params)
            }

        } catch (e) {
            return res.apiResponse(false, "Params is not a valid JSON")
        }
        if ((typeof params).toLowerCase() !== 'object' && (typeof params).toLowerCase() !== 'undefined') {
            return res.apiResponse(false, "Params is not a valid JSON")
        }
    }
    req.bodyParams = params
    next()
})





app.get('/api', function (req, res) {
    res.apiResponse(true, "Basic auth working")
})

app.get('/api/test', function (req, res) {
    res.apiResponse(true, "Basic authentication is working");
});


app.use('/api/auth', authRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/main', mainRoutes);
app.use('/api/supplier', supplierRoutes);
app.use('/api/bulk_update', bulkupdateRoutes);
app.use('/api/migration', migrationRoutes);





app.use((req, res, next) => {
    return res.send('404');
});


module.exports = app;
