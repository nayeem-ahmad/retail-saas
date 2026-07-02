const prisma = require('@prisma/client');
const accounting = require('./prisma/bootstrap-accounting.js');
const tenantRoles = require('./prisma/tenant-role.seed.js');

const DEMO_ACCOUNT_EMAIL = 'demo@erp71.com';

module.exports = {
    ...prisma,
    ...accounting,
    ...tenantRoles,
    DEMO_ACCOUNT_EMAIL,
};