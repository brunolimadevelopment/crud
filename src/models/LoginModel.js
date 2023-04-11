/**
 * OS MODELS TRATA OS DADOS
 */
const mongoose = require('mongoose');
const validator = require('validator');
const bcryptjs = require('bcryptjs');


const LoginSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true }
});

const LoginModel = mongoose.model('Login', LoginSchema);

class Login {
  constructor(body) {
    
    this.body = body;
    this.errors = [];
    this.user = null;
  }

  async login() {
    this.valida();
    
    if ( this.errors.length > 0 ) return;
    
    this.user = await LoginModel.findOne({ email: this.body.email });
    
    if(!this.user) {
      this.errors.push('Usuário não existe.');
      return;
    }

    if(!bcryptjs.compareSync(this.body.password, this.user.password)) {
      this.errors.push('Senha inválida');
      this.user = null;
      return;
    };
  }

  // Sempre que for inserir dados no banco é obrigado usar promise, utiliza-se async e await
  async register() {
    this.valida();
    
    if ( this.errors.length > 0 ) return;

    await this.userExists();

    if ( this.errors.length > 0 ) return;

    const salt = bcryptjs.genSaltSync();
    this.body.password = bcryptjs.hashSync(this.body.password, salt);

    this.user = await LoginModel.create(this.body);
    
  }

  // Checa se o usuario ja existe na base de dados
  async userExists() {
    this.user = await LoginModel.findOne({ email: this.body.email });
    if(this.user) this.errors.push('Usuário já existe');
  }
  
  valida() {
    this.cleanUp();

    // Validação
    // O e-mail precisa ser válido
    if(!validator.isEmail(this.body.email)) this.errors.push('E-mail inválido');

    // A senha precisa ter entre 3 e 50
    if(this.body.password.length < 3 || this.body.password.length > 50) {
      this.errors.push('A senha precisa ter entre 3 e 50 caracteres.');
      return;
    }
  }

  cleanUp() {
    for(const key in this.body) {
      // Se tiver algo nos dados do form que nao seja uma string, converte para um string vazia.
      if ( typeof this.body[key] !== 'string' ) {
        this.body[key] = '';
      }
    }

    // Garante apenas os campos que a gente precisa.
    // não precisamos do _csrfToken
    // Depois de limpar os campos, podemos mandar para a base de dados atraves do async register()
    this.body = {
      email: this.body.email,
      password: this.body.password
    }
  }
}

module.exports = Login;