const { parseListAccounts } = require('../controller/dataAccounts')

const passwordVerificator = async (req, res, next) => {
    const { senha_banco } = req.query

    try {
        const bankDetails = await parseListAccounts()
        const { senha } = bankDetails.banco


        if (!senha_banco) {
            return res.status(401).json({ mensagem: "informe a Senha." })
        }

        if (senha_banco === senha) {
            next()
        } else {
            return res.status(403).json({ mensagem: "A senha do banco informada é inválida!" })
        }


    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

const userVerificators = async (req, res, next) => {
    const { numero_conta, senha } = req.query

    try {
        if (!numero_conta || !senha) {
            return res.status(401).json({ mensagem: "necessito que voce esteja logado para esta ação, informando seu numero de conta e senha" })
        }

        const { contas } = await parseListAccounts()

        const account = contas.find(conta => conta.numero === Number(numero_conta))

        if (!account) {
            return res.status(404).json({ mensagem: "a conta informada para a consulta não existe ou foi excluida" })
        }

        if (senha !== account.usuario.senha) {
            return res.status(401).json({ mensagem: "senha incorreta" })
        }

        next()

    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}






module.exports = {
    passwordVerificator,
    userVerificators,
}