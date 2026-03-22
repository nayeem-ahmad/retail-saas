const prisma = require('@prisma/client');
const accounting = require('./prisma/bootstrap-accounting.js');

module.exports = {
    ...prisma,
    ...accounting,
};