const crypto = require('crypto');
const User = require('./models/userModel.js');
const Machine = require('./models/machineModel');
const MachineLog = require('./models/machineLogModel');
const Admin = require('./models/adminModel');
const mongoose = require('mongoose');
const error = require('../constants/Errors');
const db = mongoose.connect(process.env.DATABASESTRING, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true
})
    .then((res) => {
        console.log("Connect to MongoDB - success ");
    })
    .catch((err) => {
        console.log("Connect to MongoDB - fail ");
        console.log(err);
    });


// User API

exports.createUser = function (userData) {
    let user = {
        name: userData.name,
        email: userData.email,
        password: hash(userData.password),
        position_type: userData.position_type,
        subscription_type: userData.subscription_type,
        comp_description: userData.comp_description
    };
    return new User(user).save()
};

exports.getUserData = function (query) {
    return User.findOne(query)
        .select({'password': 0});
};

exports.getAdvUserData = function (email) {
    return User.aggregate([
        {$match: {email: email}},
        {$unwind: "$machines"},
        {
            $lookup: {
                from: "machines",
                localField: "machines",
                foreignField: "_id",
                as: "mac_data"
            }
        },
        {$unwind: "$mac_data"},
        {
            $group: {
                _id: "$_id",
                name: {$first: "$name"},
                position_type: {$first: "$position_type"},
                create_time: {$first: "$create_time"},
                machines: {$sum: 1},
                comp_description: {$first: "$comp_description"},
                email: {$first: "$email"},
                addData: {$first: "$addData"}
            }
        }
    ])
};

exports.getUsersData = function (query) {
    return User.find(query)
        .select({'password': 0});
};

exports.checkUser = function (userData) {
    return User
        .findOne({email: userData.email})
        .then(function (doc) {
            if (doc && doc.password == hash(userData.password)) {
                return Promise.resolve(doc)
            } else {
                return Promise.reject(error.USER_DATA_WRONG)
            }
        }).catch()
};

exports.updateUser = function (query, data) {
    return User.findOneAndUpdate(query, data, {new: true});
};

exports.deleteUser = function (query) {
    return User.deleteOne(query);
};

function hash(text) {
    return crypto.createHash('sha1')
        .update(text).digest('base64')
}

// Company API
exports.getCompanies = function () {
    return User.find({position_type: "company"})
        .select({
            password: 0,
            machines: 0,
            subscription_type: 0,
            __v: 0
        });
};

exports.getCompaniesCount = function () {
    return User.countDocuments({position_type: "company"});
};

exports.getCompanyInfo = function (email) {
    return User.aggregate([
        {
            $match: {
                email: email,
                position_type: "company"
            }
        },
        {
            $project: {
                _id: "$_id",
                name: "$name",
                position_type: "$position_type",
                create_time: "$create_time",
                machines: {$size: "$machines"},
                comp_description: "$comp_description",
                email: "$email",
                addData: "$addData"
            }
        }
    ])
};


// Machine API
exports.createMachine = function (machineData) {
    var machine = {
        mac_id: machineData.mac_id,
        code: machineData.code,
        state: machineData.state,
        prod_state: machineData.prod_state,
        products: machineData.products,
        owner: machineData.owner,
        name: machineData.name
    };
    return new Machine(machine).save();
};

exports.getMachineData = function (query) {
    return Machine.findOne(query).populate('owner', 'name position_type email').select({code: 0});
};

exports.getRawMachineData = function (query) {
    return Machine.findOne(query).lean();
};

exports.updateMachine = function (query, data) {
    return Machine.findOneAndUpdate(query, data, {new: true});
};

exports.deleteMachine = function (query) {
    return Machine.deleteOne(query);
};

exports.getMachinesData = function (query) {
    return Machine.find(query);
};

exports.getMachinesDataAgr = function (query) {
    return Machine.aggregate([
        {$match: query},
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner_data"
            }
        },
        {$unwind: "$owner_data"},
        {
            $project: {
                code: 0,
                owner_data: {
                    machines: 0,
                    subscription_type: 0,
                    password: 0,
                    __v: 0
                }
            }
        }
    ]);
};

// Machine Log API

exports.setMachineLog = function (macData) {
    let log = {
        mac_id: macData.mac_id,
        op_type: macData.op_type,
        priority: macData.priority,
        is_resolved: macData.is_resolved,
        descry: macData.descry,
        data: macData.data,
        mac_db_id: macData.mac_db_id
    };
    return new MachineLog(log).save();
};

exports.deleteMachineLogs = function (query) {
    return MachineLog.deleteMany(query);
};

exports.getMachineLogs = function (query) {
    return MachineLog.find(query);
};

exports.updateMachineLog = function (query, data) {
    return MachineLog.findOneAndUpdate(query, data, {new: true});
};

exports.getMachineWarnings = function (machine_id) {
    return MachineLog.find({mac_id: machine_id, priority: "warning"});
};
exports.getLogsStatistic = function (machine_id) {
    return MachineLog.aggregate([
        {
            $match: {mac_id: machine_id, op_type: "sell"}
        },
        {
            $group: {
                _id: {$month: "$date"},
                average: {$avg: "$data.price"},
                sum: {$sum: "$data.price"}
            }
        },
        {
            $project: {
                _id: 0,
                month: "$_id",
                average: "$average",
                sum: "$sum"
            }
        }
    ]);
};

exports.getLogsProductStat = function (machine_id) {
    return MachineLog.aggregate([
        {
            $match: {mac_id: machine_id, op_type: "sell"}
        },
        {
            $group: {
                _id: {$hour: "$date"},
                average: {$avg: "$data.price"},
                sum: {$sum: "$data.price"}
            }
        },
        {
            $project: {
                _id: 0,
                hour: "$_id",
                average: "$average",
                sum: "$sum"
            }
        }
    ]);
};

exports.getMachinesStat = function (machines) {
    return MachineLog.aggregate([
        {
            $match: {
                mac_db_id: {$in: machines},
                op_type: "sell"
            }
        },
        {
            $group: {
                _id: "$mac_id",
                average: {$avg: "$data.price"},
                sum: {$sum: "$data.price"},
                count: {$sum: 1}
            }
        },
        {$sort: {"_id": 1}}
    ]);
};

// ADMIN API

exports.createAdmin = function (data) {
    let admin = {
        email: data.email,
        password: hash(data.password),
        position: data.position
    };
    return new Admin(admin).save();
};

exports.checkAdmin = function (data) {
    return Admin.findOne({email: data.email})
        .then((doc) => {
            if (doc && doc.password == hash(data.password)) {
                return Promise.resolve(doc);
            } else {
                return Promise.reject(error.USER_DATA_WRONG);
            }
        }).catch()
};

exports.updateAdmin = function (query, data) {
    return Admin.findOneAndUpdate(query, data, {new: true});
};

exports.getAdminInfo = function (query) {
    return Admin.findOne(query).select({password: 0}).lean();
};

//
exports.machineCount = function () {
    return Machine.countDocuments({});
};

exports.userCount = function () {
    return User.countDocuments({});
};

exports.logCount = function () {
    return MachineLog.countDocuments({});
};