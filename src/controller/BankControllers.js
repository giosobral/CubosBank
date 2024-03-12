const {
    parseListAccounts,
    writeFileAccounts,
    dataVerificator,
    accountExistVerificator } = require('./dataAccounts')
const { format } = require('date-fns')


const getAccounts = async (req, res) => {
    try {
        const { contas } = await parseListAccounts()


        return res.status(200).json(contas)
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

const createAccount = async (req, res) => {
    let { nome, cpf, data_nascimento, telefone, email, senha } = req.body

    try {
        let mensagem = await dataVerificator(nome, cpf, data_nascimento, telefone, email, senha)

        if (mensagem !== "ok") {
            return res.status(400).json({ mensagem: mensagem })
        }


        const CubosBank = await parseListAccounts()
        const { contas } = CubosBank

        let cpfExist = contas.find(conta => conta.usuario.cpf === cpf)
        let emailExist = contas.find(conta => conta.usuario.email === email)

        if (cpfExist) {
            return res.status(409).json({ mensagem: "já existe uma conta com este CPF" })

        }
        if (emailExist) {
            return res.status(409).json({ mensagem: "já existe uma conta com este email, não teria um secundário?" })

        }


        const account = {
            numero: CubosBank.contagem++,
            saldo: 0,
            usuario: {
                nome,
                cpf,
                data_nascimento,
                telefone,
                email,
                senha
            }
        }

        contas.push(account)

        await writeFileAccounts(CubosBank)

        return res.status(201).json()
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }

}
const updateAccount = async (req, res) => {
    const { numeroConta } = req.params
    const { nome, cpf, data_nascimento, telefone, email, senha } = req.body


    try {

        if (isNaN(Number(numeroConta))) {
            return res.status(400).json({ mensagem: "insira um numero de conta válido" })
        }


        const mensagem = await dataVerificator(nome, cpf, data_nascimento, telefone, email, senha)

        if (mensagem !== "ok") {
            return res.status(400).json({ mensagem: mensagem })
        }

        const CubosBank = await parseListAccounts()
        const { contas } = CubosBank

        const othersAccounts = contas.filter(conta => conta.numero !== Number(numeroConta))

        let cpfExist = othersAccounts.find(conta => conta.usuario.cpf === cpf)
        let emailExist = othersAccounts.find(conta => conta.usuario.email === email)

        if (cpfExist) {
            return res.status(409).json({ mensagem: "este CPF esta cadastrado em outra conta" })

        }
        if (emailExist) {
            return res.status(409).json({ mensagem: "Este email esta cadastrado em outra conta, forneça outro" })

        }


        let accountToUpdate = contas.find(conta => conta.numero === Number(numeroConta))

        if (!accountToUpdate) {
            return res.status(404).json({ mensagem: "numero da conta não cadastrado" })
        }

        accountToUpdate.usuario.nome = nome ?? accountToUpdate.usuario.nome
        accountToUpdate.usuario.cpf = cpf ?? accountToUpdate.usuario.cpf
        accountToUpdate.usuario.data_nascimento = data_nascimento ?? accountToUpdate.usuario.data_nascimento
        accountToUpdate.usuario.telefone = telefone ?? accountToUpdate.usuario.telefone
        accountToUpdate.usuario.email = email ?? accountToUpdate.usuario.email
        accountToUpdate.usuario.senha = senha ?? accountToUpdate.usuario.senha

        await writeFileAccounts(CubosBank)

        return res.status(204).json()

    } catch (error) {

    }
}

const deleteAccount = async (req, res) => {
    const { numeroConta } = req.params

    try {
        if (isNaN(Number(numeroConta))) {
            return res.status(400).json({ mensagem: "insira um numero válido" })
        }

        let CubosBank = await parseListAccounts()


        const accountToDelete = CubosBank.contas.find(conta => conta.numero === Number(numeroConta))

        if (!accountToDelete) {
            return res.status(404).json({ mensagem: "não existe uma conta com este numero para ser excluida" })
        }

        if (accountToDelete.saldo !== 0) {
            return res.status(400).json({ mensagem: "uma conta só pode ser excluída se o saldo for zero" })
        }


        CubosBank.contas = CubosBank.contas.filter(conta => conta.numero !== Number(numeroConta))


        await writeFileAccounts(CubosBank)

        return res.status(204).json()
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }

}

const depositToAccount = async (req, res) => {
    const { numero_conta, valor } = req.body

    try {
        if (!numero_conta || !valor) {
            return res.status(400).json({ mensagem: "preencha corretamente todos os campos para realizar o deposito" })
        }

        const CubosBank = await parseListAccounts()
        const { contas } = CubosBank

        const account = contas.find(conta => conta.numero === Number(numero_conta))

        if (!account) {
            return res.status(404).json({ mensagem: "A conta na qual você esta tentando realizar este depósito não existe ou já foi encerrada." })
        }

        if (valor <= 0) {
            return res.status(400).json({ mensagem: " valores menores ou iguais a zero não são permitidos." })
        }

        account.saldo += valor

        const depositRecord = {
            data: format(new Date(), "dd/MM/yyyy - HH:mm:ss"),
            numero_conta,
            valor,
        }

        CubosBank.depositos.push(depositRecord)

        await writeFileAccounts(CubosBank)

        return res.status(204).json()
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

const withdrawToAccount = async (req, res) => {
    const { numero_conta, valor, senha } = req.body

    try {
        if (!numero_conta || !valor) {
            return res.status(400).json({ mensagem: "necessito que você informe o numero da conta, e o valor a ser sacado" })
        }

        if (!senha) {
            return res.status(401).json({ mensagem: "para esta ação preciso que você se autentique informando sua senha" })
        }

        const CubosBank = await parseListAccounts()

        const account = CubosBank.contas.find(conta => conta.numero === Number(numero_conta))

        if (!account) {
            return res.status(404).json({ mensagem: "A conta que você esta tentando retirar fundos não existe, ou foi excluida" })
        }

        if (senha !== account.usuario.senha) {
            return res.status(403).json({ mensagem: "senha incorreta" })
        }

        if (account.saldo < valor) {
            return res.status(400).json({ mensagem: "Valor indisponível para saque, O seu saldo é menor do que a quantia que você está tentando retirar" })
        }

        account.saldo -= valor

        const withdrawRecord = {
            data: format(new Date(), "dd/MM/yyyy - HH:mm:ss"),
            numero_conta,
            valor,
        }

        CubosBank.saques.push(withdrawRecord)

        await writeFileAccounts(CubosBank)
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }

    return res.status(204).json()

}

const transferValues = async (req, res) => {
    const { numero_conta_origem, numero_conta_destino, valor, senha } = req.body

    try {
        if (!numero_conta_origem || !numero_conta_destino) {
            return res.status(400).json({ menssagem: "você tem que informar a conta de origem e a conta de destino para a transferencia" })
        }
        if (!senha) {
            return res.status(401).json({ mensagem: "para esta ação a senha deverá ser informada" })
        }

        const CubosBank = await parseListAccounts()
        const { contas } = CubosBank

        const originAccount = contas.find(conta => conta.numero === Number(numero_conta_origem))

        if (!originAccount) {
            return res.status(404).json({ mensagem: "a conta de origem que voce informou não existe, ou foi excluida" })
        }

        const targetAccount = contas.find(conta => conta.numero === Number(numero_conta_destino))

        if (!targetAccount) {
            return res.status(404).json({ mensagem: "a conta de destino que voce informou não existe, ou foi excluida" })
        }

        if (senha !== originAccount.usuario.senha) {
            return res.status(403).json({ mensagem: "senha incorreta" })
        }

        if (originAccount.saldo < valor) {
            return res.status(400).json({ mensagem: "saldo insuficiente para realizar esta transferencia" })
        }


        originAccount.saldo -= valor
        targetAccount.saldo += valor


        const transferRecord = {
            data: format(new Date(), "dd/MM/yyyy - HH:mm:ss"),
            numero_conta_origem,
            numero_conta_destino,
            valor,
        }

        CubosBank.transferencias.push(transferRecord)

        await writeFileAccounts(CubosBank)

        return res.status(204).json()
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

const checkBalance = async (req, res) => {
    const { numero_conta } = req.query

    const accountConsulted = await accountExistVerificator(numero_conta)

    return res.status(200).json({ mensagem: `O seu saldo é: ${accountConsulted.saldo}` })
}

const issueExtract = async (req, res) => {
    const { numero_conta } = req.query


    const accountConsulted = await accountExistVerificator(numero_conta)

    if (!accountConsulted) {
        return res.status(404).json({ mensagem: "conta inexistente ou foi excluida" })
    }

    const { depositos, saques, transferencias, } = await parseListAccounts()

    const accountDeposits = depositos.filter(deposito => deposito.numero_conta === numero_conta)
    const accountWithdrawals = saques.filter(saque => saque.numero_conta === numero_conta)
    const transfersSent = transferencias.filter(transferencia => transferencia.numero_conta_origem === numero_conta)
    const transfersReceived = transferencias.filter(transferencia => transferencia.numero_conta_destino === numero_conta)

    const extract = {
        depositos: accountDeposits,
        saques: accountWithdrawals,
        transferencias_enviadas: transfersSent,
        transferencias_recebidas: transfersReceived
    }

    return res.status(200).json(extract)

}

module.exports = {
    getAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    depositToAccount,
    withdrawToAccount,
    transferValues,
    checkBalance,
    issueExtract
}