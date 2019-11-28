var express = require('express');
var api = require('../db/dbConnnection');
var responses = require('../responseFactory');

exports.loginFunc = function (req, res, next) {
    if (req.session.user) return res.send(responses.responseAuthorizeFail("already login"));

    api.checkUser(req.body)
        .then(function (user) {
            if (user) {
                req.session.user = {id: user._id, email: user.email, db_id: user._id};
                res.send(responses.responseAuthorizeOk());
            } else {
                res.send(responses.responseAuthorizeFail('error'));
            }
        })
        .catch(function (error) {
            res.send(responses.responseAuthorizeFail(error));
        })

};

exports.registerNewAccount = function (req, res, next) {
    api.createUser(req.body)
        .then(function (result) {
            res.send(responses.responseSuccessOk());
        })
        .catch(function (err) {
            if (err.code == 11000) {
                res.send(responses.responseSuccessFail("email already exist"));
            }
        })
};

exports.logoutFunc = function (req, res, next) {
    if (req.session.user) {
        delete req.session.user;
        res.status(200).send(responses.responseSuccessOk());
    } else {
        res.send(responses.responseSuccessFail("already logout"));
    }
};