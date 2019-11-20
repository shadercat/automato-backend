var express = require('express');
var responses = require('../responseFactory');
var api = require('../db/dbConnnection');

// user api
exports.getIsAuthorized = function (req, res, next) {
    res.send(responses.responseAuthorizeOk());
};

exports.getUserData = function (req, res, next) {
    api.getUserData({email: req.session.user.email}).lean()
        .then((data) => {
            res.send(responses.responseDataOk(data));
        })
        .catch((err) => {
            res.send(responses.responseDataFail(err));
        })
};

exports.getMachinesData = function (req, res, next) {
    api.getUserData({email: req.session.user.email}).lean().then((data) => {
        api.getMachinesData({indet: {$in: data.machines}}).lean()
            .then((result) => {
                let macs = result.map(function (item) {
                    item.isOwner = (item.owner === req.session.user.db_id);
                    return item;
                });
                res.send(responses.responseDataOk(macs));
            })
            .catch((err) => {
                res.send(responses.responseDataFail(err));
            });
    });
};

exports.unbindMachine = function (req, res, next) {
    api.updateUser({_id: req.session.user.db_id}, {$pull: {machines: req.body.indet}}).lean()
        .then((result) => {
            res.send(responses.responseSuccessOk());
        })
        .catch((err) => {
            res.send(err);
        })
};

exports.bindMachine = function (req, res, next) {
    api.getMachineData({indet: req.body.indet}).lean()
        .then((result) => {
            if(result.code === req.body.code){
                api.updateUser({_id: req.session.user.db_id}, {$push: {machines: req.body.indet}}).lean()
                    .then((result2) => {
                        res.send(responses.responseSuccessOk());
                    })
                    .catch((err) => {
                        res.send(responses.responseSuccessFail(err));
                    })
            } else {
                res.send(responses.responseSuccessFail("access denied"))
            }
        })
        .catch((err) => {
            res.send(responses.responseSuccessFail(err));
        })
};

exports.deleteMachineHistory = function (req, res, next) {
    api.getMachineData({indet: req.body.indet}).lean()
        .then((result) => {
            if (result.ouwner === req.session.user.db_id) {
                api.deleteMachineLogs({mac_indet: result.indet}).lean()
                    .then((result2) => {
                        res.send(responses.responseSuccessOk());
                    })
                    .catch((err) => {
                        res.send(responses.responseSuccessFail(err));
                    })
            } else {
                res.send(responses.responseSuccessFail("access denied"));
            }
        })
        .catch((err) => {
            res.send(responses.responseSuccessFail(err));
        });
};

exports.getMachineLogs = function (req, res, next) {
    api.getMachineLogs({mac_indet: req.body.indet}).lean()
        .then((result) => {
            res.send(responses.responseDataOk(result));
        })
        .catch((err) => {
            res.send(responses.responseDataFail(err));
        })
};