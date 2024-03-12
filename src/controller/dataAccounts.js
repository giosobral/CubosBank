const fs = require('fs/promises')

const parseListAccounts = async () => {
    return JSON.parse(await fs.readFile('./src/bancodedados.json'))
}

const writeFileAccounts = async (updatedFile) => {
    await fs.writeFile('./src/bancodedados.json', JSON.stringify(updatedFile))
}

const dataVerificator = async (nome, cpf, data_nascimento, telefone, email, senha) => {
    let mensagem = "ok"

    if (!nome) {
        mensagem = "Por favor, preencha o seu nome."

    }
    if (!cpf) {
        mensagem = "Por favor, nos informe o seu cpf."

    }
    if (!data_nascimento) {
        mensagem = "Por favor, informe a sua data de nascimento."

    }
    if (!telefone) {
        mensagem = "Por favor, informe o seu telefone"

    }
    if (!email) {
        mensagem = "esta faltando o seu email"

    }
    if (!senha) {
        mensagem = "Por favor, crie uma senha"

    }


    return mensagem
}

const accountExistVerificator = async (accountNumber) => {
    const { contas } = await parseListAccounts()
    accountNumber = Number(accountNumber)

    const account = contas.find(conta => conta.numero === accountNumber)

    return account
}

module.exports = {
    parseListAccounts,
    writeFileAccounts,
    dataVerificator,
    accountExistVerificator,

}