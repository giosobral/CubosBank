const express = require('express')

const { passwordVerificator, userVerificators } = require('../middleware/accountverifications')

const {
    createAccount,
    getAccounts,
    updateAccount,
    deleteAccount,
    depositToAccount,
    withdrawToAccount,
    transferValues,
    checkBalance,
    issueExtract,
} = require('../controller/BankControllers')

const routes = express()

routes.get('/contas', passwordVerificator, getAccounts)
routes.post('/contas', createAccount)
routes.put('/contas/:numeroConta/usuario', updateAccount)
routes.delete('/contas/:numeroConta', deleteAccount)
routes.post('/transacoes/depositar', depositToAccount)
routes.post('/transacoes/sacar', withdrawToAccount)
routes.post('/transacoes/transferir', transferValues)
routes.get('/contas/saldo', userVerificators, checkBalance)
routes.get('/contas/extrato', userVerificators, issueExtract)


module.exports = routes