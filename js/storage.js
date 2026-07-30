/**
 * Camada de armazenamento do aplicativo.
 *
 * Somente este arquivo deve acessar o localStorage diretamente.
 */

const Storage = {
  /**
   * Nome da chave principal salva no navegador.
   */
  databaseKey: "controleFinanceiroDB",

  /**
   * Versão atual da estrutura do banco.
   */
  databaseVersion: 1,

  /**
   * Cria a estrutura padrão do banco de dados.
   */
  createDefaultDatabase() {
    return {
      version: this.databaseVersion,

      receitas: [],

      gastos: [],

      categorias: {
        receitas: [
          {
            id: "salario",
            nome: "Salário",
            tipo: "receita",
            cor: "#31c783",
            padrao: true
          },
          {
            id: "renda-extra",
            nome: "Renda Extra",
            tipo: "receita",
            cor: "#6558ff",
            padrao: true
          },
          {
            id: "poker-receita",
            nome: "Poker",
            tipo: "receita",
            cor: "#8379ff",
            padrao: true
          },
          {
            id: "bets-receita",
            nome: "Bets",
            tipo: "receita",
            cor: "#e144d1",
            padrao: true
          },
          {
            id: "outros-receita",
            nome: "Outros",
            tipo: "receita",
            cor: "#727786",
            padrao: true
          }
        ],

        gastos: [
          {
            id: "alimentacao",
            nome: "Alimentação",
            tipo: "gasto",
            cor: "#6558ff",
            padrao: true
          },
          {
            id: "casa",
            nome: "Casa",
            tipo: "gasto",
            cor: "#4c62ff",
            padrao: true
          },
          {
            id: "transporte",
            nome: "Transporte",
            tipo: "gasto",
            cor: "#e144d1",
            padrao: true
          },
          {
            id: "compras",
            nome: "Compras",
            tipo: "gasto",
            cor: "#f3b93f",
            padrao: true
          },
          {
            id: "saude",
            nome: "Saúde",
            tipo: "gasto",
            cor: "#31c783",
            padrao: true
          },
          {
            id: "lazer",
            nome: "Lazer",
            tipo: "gasto",
            cor: "#ff5b69",
            padrao: true
          },
          {
            id: "estudos",
            nome: "Estudos",
            tipo: "gasto",
            cor: "#8379ff",
            padrao: true
          },
          {
            id: "assinaturas",
            nome: "Assinaturas",
            tipo: "gasto",
            cor: "#b2b5c2",
            padrao: true
          },
          {
            id: "outros-gasto",
            nome: "Outros",
            tipo: "gasto",
            cor: "#727786",
            padrao: true
          }
        ]
      },

      limites: {
        diarioGeral: 0,
        mensalGeral: 0,

        categorias: {
          alimentacao: 0,
          casa: 0,
          transporte: 0,
          compras: 0,
          saude: 0,
          lazer: 0,
          estudos: 0,
          assinaturas: 0,
          outros: 0
        },

        poker: 0,
        bets: 0
      },

      metas: {
        economiaMensal: 0,
        patrimonio: 0,
        bancaPoker: 0,
        bancaBets: 0
      },

      poker: {
        bancaInicial: 0,
        depositos: [],
        saques: [],
        sessoes: []
      },

      bets: {
        bancaInicial: 0,
        depositos: [],
        saques: [],
        apostas: []
      },

      transferencias: [],

      configuracoes: {
        moeda: "BRL",
        idioma: "pt-BR",
        tema: "dark",
        primeiroDiaMes: 1,
        alertasAtivos: true
      },

      metadata: {
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
      }
    };
  },

  /**
   * Verifica se já existe banco salvo.
   */
  exists() {
    return localStorage.getItem(this.databaseKey) !== null;
  },

  /**
   * Cria o banco pela primeira vez.
   */
  initialize() {
    if (!this.exists()) {
      const database = this.createDefaultDatabase();

      this.saveDatabase(database);

      return database;
    }

    const database = this.getDatabase();

    return this.migrateDatabase(database);
  },

  /**
   * Carrega o banco completo.
   */
  getDatabase() {
    const savedDatabase = localStorage.getItem(this.databaseKey);

    if (!savedDatabase) {
      return this.createDefaultDatabase();
    }

    try {
      const parsedDatabase = JSON.parse(savedDatabase);

      if (!parsedDatabase || typeof parsedDatabase !== "object") {
        throw new Error("Banco de dados inválido.");
      }

      return parsedDatabase;
    } catch (error) {
      console.error(
        "Não foi possível carregar o banco de dados:",
        error
      );

      return this.createDefaultDatabase();
    }
  },

  /**
   * Salva o banco completo.
   */
  saveDatabase(database) {
    if (!database || typeof database !== "object") {
      throw new Error(
        "O banco informado para salvar é inválido."
      );
    }

    const databaseToSave = Utils.clone(database);

    databaseToSave.version = this.databaseVersion;

    databaseToSave.metadata = {
      ...databaseToSave.metadata,
      atualizadoEm: new Date().toISOString()
    };

    localStorage.setItem(
      this.databaseKey,
      JSON.stringify(databaseToSave)
    );

    return databaseToSave;
  },

  /**
   * Atualiza uma parte específica do banco.
   *
   * Exemplo:
   * Storage.updateSection("gastos", novaLista)
   */
  updateSection(sectionName, value) {
    const database = this.getDatabase();

    if (!(sectionName in database)) {
      throw new Error(
        `A seção "${sectionName}" não existe no banco.`
      );
    }

    database[sectionName] = Utils.clone(value);

    return this.saveDatabase(database);
  },

  /**
   * Retorna uma seção específica do banco.
   */
  getSection(sectionName) {
    const database = this.getDatabase();

    if (!(sectionName in database)) {
      return null;
    }

    return Utils.clone(database[sectionName]);
  },

  /**
   * Adiciona um registro dentro de uma lista.
   *
   * Exemplo:
   * Storage.addItem("gastos", gasto)
   */
  addItem(sectionName, item) {
    const database = this.getDatabase();

    if (!Array.isArray(database[sectionName])) {
      throw new Error(
        `A seção "${sectionName}" não é uma lista.`
      );
    }

    const newItem = {
      ...Utils.clone(item),

      id:
        item.id ||
        Utils.generateId(sectionName.slice(0, -1)),

      createdAt:
        item.createdAt ||
        Date.now(),

      updatedAt: Date.now()
    };

    database[sectionName].push(newItem);

    this.saveDatabase(database);

    return Utils.clone(newItem);
  },

  /**
   * Atualiza um registro de uma lista.
   */
  updateItem(sectionName, itemId, changes) {
    const database = this.getDatabase();

    if (!Array.isArray(database[sectionName])) {
      throw new Error(
        `A seção "${sectionName}" não é uma lista.`
      );
    }

    const itemIndex = database[sectionName].findIndex(
      item => item.id === itemId
    );

    if (itemIndex === -1) {
      return null;
    }

    database[sectionName][itemIndex] = {
      ...database[sectionName][itemIndex],
      ...Utils.clone(changes),

      id: itemId,

      updatedAt: Date.now()
    };

    this.saveDatabase(database);

    return Utils.clone(database[sectionName][itemIndex]);
  },

  /**
   * Exclui um registro de uma lista.
   */
  deleteItem(sectionName, itemId) {
    const database = this.getDatabase();

    if (!Array.isArray(database[sectionName])) {
      throw new Error(
        `A seção "${sectionName}" não é uma lista.`
      );
    }

    const originalLength =
      database[sectionName].length;

    database[sectionName] =
      database[sectionName].filter(
        item => item.id !== itemId
      );

    const itemWasDeleted =
      database[sectionName].length < originalLength;

    if (itemWasDeleted) {
      this.saveDatabase(database);
    }

    return itemWasDeleted;
  },

  /**
   * Busca um registro pelo ID.
   */
  findItemById(sectionName, itemId) {
    const database = this.getDatabase();

    if (!Array.isArray(database[sectionName])) {
      return null;
    }

    const item = database[sectionName].find(
      currentItem => currentItem.id === itemId
    );

    return item ? Utils.clone(item) : null;
  },

  /**
   * Remove todos os dados e recria o banco.
   */
  resetDatabase() {
    localStorage.removeItem(this.databaseKey);

    return this.initialize();
  },

  /**
   * Exporta o banco como texto JSON.
   */
  exportDatabase() {
    const database = this.getDatabase();

    return JSON.stringify(database, null, 2);
  },

  /**
   * Baixa um arquivo de backup.
   */
  downloadBackup() {
    const backupContent = this.exportDatabase();

    const backupBlob = new Blob(
      [backupContent],
      {
        type: "application/json"
      }
    );

    const backupUrl =
      URL.createObjectURL(backupBlob);

    const downloadLink =
      document.createElement("a");

    downloadLink.href = backupUrl;

    downloadLink.download =
      `controle-financeiro-backup-${Utils.getToday()}.json`;

    document.body.appendChild(downloadLink);

    downloadLink.click();

    downloadLink.remove();

    URL.revokeObjectURL(backupUrl);
  },

  /**
   * Importa um banco recebido em formato JSON.
   */
  importDatabase(jsonContent) {
    try {
      const importedDatabase =
        typeof jsonContent === "string"
          ? JSON.parse(jsonContent)
          : jsonContent;

      if (
        !importedDatabase ||
        typeof importedDatabase !== "object"
      ) {
        throw new Error(
          "O arquivo selecionado não contém um banco válido."
        );
      }

      const normalizedDatabase =
        this.normalizeDatabase(importedDatabase);

      this.saveDatabase(normalizedDatabase);

      return {
        success: true,
        database: normalizedDatabase
      };
    } catch (error) {
      console.error(
        "Erro ao importar banco de dados:",
        error
      );

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Preenche estruturas ausentes em backups antigos.
   */
  normalizeDatabase(database) {
    const defaultDatabase =
      this.createDefaultDatabase();

    return {
      ...defaultDatabase,
      ...Utils.clone(database),

      categorias: {
        ...defaultDatabase.categorias,
        ...(database.categorias || {})
      },

      limites: {
        ...defaultDatabase.limites,
        ...(database.limites || {}),

        categorias: {
          ...defaultDatabase.limites.categorias,
          ...(database.limites?.categorias || {})
        }
      },

      metas: {
        ...defaultDatabase.metas,
        ...(database.metas || {})
      },

      poker: {
        ...defaultDatabase.poker,
        ...(database.poker || {})
      },

      bets: {
        ...defaultDatabase.bets,
        ...(database.bets || {})
      },

      configuracoes: {
        ...defaultDatabase.configuracoes,
        ...(database.configuracoes || {})
      },

      metadata: {
        ...defaultDatabase.metadata,
        ...(database.metadata || {})
      },

      version:
        Number(database.version) ||
        this.databaseVersion
    };
  },

  /**
   * Atualiza bancos antigos para a versão atual.
   */
  migrateDatabase(database) {
    const databaseVersion =
      Number(database.version) || 1;

    let migratedDatabase =
      this.normalizeDatabase(database);

    if (databaseVersion < this.databaseVersion) {
      /*
       * Futuras migrações serão adicionadas aqui.
       *
       * Exemplo:
       *
       * if (databaseVersion < 2) {
       *   migratedDatabase = this.migrateToVersion2(
       *     migratedDatabase
       *   );
       * }
       */
    }

    migratedDatabase.version =
      this.databaseVersion;

    this.saveDatabase(migratedDatabase);

    return migratedDatabase;
  },

  /**
   * Atalhos para os módulos do sistema.
   */

  getReceitas() {
    return this.getSection("receitas") || [];
  },

  getGastos() {
    return this.getSection("gastos") || [];
  },

  getCategorias() {
    return this.getSection("categorias");
  },

  getLimites() {
    return this.getSection("limites");
  },

  getMetas() {
    return this.getSection("metas");
  },

  getPoker() {
    return this.getSection("poker");
  },

  getBets() {
    return this.getSection("bets");
  },

  getTransferencias() {
    return this.getSection("transferencias") || [];
  },

  getConfiguracoes() {
    return this.getSection("configuracoes");
  },

  saveReceita(receita) {
    return this.addItem("receitas", receita);
  },

  saveGasto(gasto) {
    return this.addItem("gastos", gasto);
  },

  saveTransferencia(transferencia) {
    return this.addItem(
      "transferencias",
      transferencia
    );
  }
};

window.Storage = Storage;