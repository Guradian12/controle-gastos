/**
 * Gerenciamento de receitas e gastos pessoais.
 *
 * Este módulo controla:
 * - cadastro de receitas;
 * - cadastro de gastos;
 * - edição e exclusão;
 * - filtros por período e categoria;
 * - totais diários e mensais;
 * - acompanhamento dos limites;
 * - resumos para o dashboard.
 *
 * Poker e Bets não devem ser cadastrados aqui.
 */

const Expenses = {
  /**
   * Tipos de lançamento aceitos.
   */
  validTypes: ["receita", "gasto"],

  /**
   * Formas de pagamento disponíveis.
   */
  paymentMethods: [
    "pix",
    "dinheiro",
    "debito",
    "credito",
    "boleto",
    "transferencia",
    "outro"
  ],

  /**
   * Tipos de gasto.
   */
  expenseTypes: [
    "variavel",
    "fixo",
    "parcelado"
  ],

  /**
   * Status aceitos para lançamentos.
   */
  validStatuses: [
    "pago",
    "pendente",
    "recebido",
    "previsto"
  ],

  /**
   * Normaliza o tipo de lançamento.
   */
  normalizeType(type) {
    const normalizedType = String(type || "")
      .trim()
      .toLowerCase();

    if (!this.validTypes.includes(normalizedType)) {
      throw new Error(
        'Tipo de lançamento inválido. Use "receita" ou "gasto".'
      );
    }

    return normalizedType;
  },

  /**
   * Normaliza textos simples.
   */
  normalizeText(text) {
    return String(text || "")
      .trim()
      .replace(/\s+/g, " ");
  },

  /**
   * Converte valores recebidos do formulário
   * para número.
   *
   * Aceita:
   * 1500
   * "1500"
   * "1.500,00"
   * "R$ 1.500,00"
   */
  normalizeValue(value) {
    if (typeof value === "number") {
      return value;
    }

    return Utils.parseCurrency(value);
  },

  /**
   * Verifica se uma data está no formato YYYY-MM-DD.
   */
  isValidDate(date) {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(
        String(date || "")
      )
    ) {
      return false;
    }

    const parsedDate = new Date(`${date}T12:00:00`);

    return !Number.isNaN(parsedDate.getTime());
  },

  /**
   * Retorna o nome da seção do banco.
   */
  getSectionName(type) {
    const normalizedType = this.normalizeType(type);

    return normalizedType === "receita"
      ? "receitas"
      : "gastos";
  },

  /**
   * Define o status padrão de um lançamento.
   */
  getDefaultStatus(type) {
    return type === "receita"
      ? "recebido"
      : "pago";
  },

  /**
   * Valida a categoria.
   */
  validateCategory(categoryId, type) {
    const category = Categories.findById(
      categoryId,
      type
    );

    if (!category) {
      throw new Error(
        `Selecione uma categoria de ${type}.`
      );
    }

    return category;
  },

  /**
   * Valida e normaliza um lançamento.
   */
  validateTransactionData(
    transactionData,
    currentTransaction = null
  ) {
    if (
      !transactionData ||
      typeof transactionData !== "object"
    ) {
      throw new Error(
        "Os dados do lançamento são inválidos."
      );
    }

    const type = this.normalizeType(
      transactionData.tipo ??
      currentTransaction?.tipo
    );

    const description = this.normalizeText(
      transactionData.descricao ??
      currentTransaction?.descricao
    );

    if (!description) {
      throw new Error(
        "Informe a descrição do lançamento."
      );
    }

    if (description.length < 2) {
      throw new Error(
        "A descrição deve ter pelo menos 2 caracteres."
      );
    }

    if (description.length > 100) {
      throw new Error(
        "A descrição deve ter no máximo 100 caracteres."
      );
    }

    const value = this.normalizeValue(
      transactionData.valor ??
      currentTransaction?.valor
    );

    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      throw new Error(
        "Informe um valor maior que zero."
      );
    }

    const date =
      transactionData.data ??
      currentTransaction?.data ??
      Utils.getToday();

    if (!this.isValidDate(date)) {
      throw new Error(
        "Informe uma data válida."
      );
    }

    const categoryId =
      transactionData.categoriaId ??
      currentTransaction?.categoriaId ??
      transactionData.categoria ??
      currentTransaction?.categoria;

    const category = this.validateCategory(
      categoryId,
      type
    );

    const notes = this.normalizeText(
      transactionData.observacao ??
      currentTransaction?.observacao ??
      ""
    );

    if (notes.length > 500) {
      throw new Error(
        "A observação deve ter no máximo 500 caracteres."
      );
    }

    const status = String(
      transactionData.status ??
      currentTransaction?.status ??
      this.getDefaultStatus(type)
    )
      .trim()
      .toLowerCase();

    if (!this.validStatuses.includes(status)) {
      throw new Error(
        "O status informado é inválido."
      );
    }

    const normalizedData = {
      tipo: type,
      descricao: description,
      valor: value,
      data: date,
      categoriaId: category.id,
      categoriaNome: category.nome,
      observacao: notes,
      status
    };

    if (type === "gasto") {
      const paymentMethod = String(
        transactionData.formaPagamento ??
        currentTransaction?.formaPagamento ??
        "pix"
      )
        .trim()
        .toLowerCase();

      if (
        !this.paymentMethods.includes(
          paymentMethod
        )
      ) {
        throw new Error(
          "A forma de pagamento informada é inválida."
        );
      }

      const expenseType = String(
        transactionData.tipoGasto ??
        currentTransaction?.tipoGasto ??
        "variavel"
      )
        .trim()
        .toLowerCase();

      if (
        !this.expenseTypes.includes(
          expenseType
        )
      ) {
        throw new Error(
          "O tipo de gasto informado é inválido."
        );
      }

      normalizedData.formaPagamento =
        paymentMethod;

      normalizedData.tipoGasto =
        expenseType;

      normalizedData.parcelas =
        this.normalizeInstallments(
          transactionData.parcelas ??
          currentTransaction?.parcelas,
          expenseType
        );
    }

    if (type === "receita") {
      normalizedData.origem =
        this.normalizeText(
          transactionData.origem ??
          currentTransaction?.origem ??
          category.nome
        );
    }

    return normalizedData;
  },

  /**
   * Normaliza informações de parcelamento.
   */
  normalizeInstallments(
    installments,
    expenseType
  ) {
    if (expenseType !== "parcelado") {
      return null;
    }

    const total = Number(
      installments?.total ?? 1
    );

    const current = Number(
      installments?.atual ?? 1
    );

    if (
      !Number.isInteger(total) ||
      total < 2 ||
      total > 120
    ) {
      throw new Error(
        "O total de parcelas deve estar entre 2 e 120."
      );
    }

    if (
      !Number.isInteger(current) ||
      current < 1 ||
      current > total
    ) {
      throw new Error(
        "A parcela atual é inválida."
      );
    }

    return {
      atual: current,
      total
    };
  },

  /**
   * Cria um lançamento genérico.
   */
  create(transactionData) {
    const validatedData =
      this.validateTransactionData(
        transactionData
      );

    const sectionName = this.getSectionName(
      validatedData.tipo
    );

    const transaction = {
      ...validatedData,

      id: Utils.generateId(
        validatedData.tipo
      ),

      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    };

    return Storage.addItem(
      sectionName,
      transaction
    );
  },

  /**
   * Cria uma receita.
   */
  createIncome(incomeData) {
    return this.create({
      ...incomeData,
      tipo: "receita"
    });
  },

  /**
   * Cria um gasto.
   */
  createExpense(expenseData) {
    return this.create({
      ...expenseData,
      tipo: "gasto"
    });
  },

  /**
   * Retorna todas as receitas.
   */
  getIncomes() {
    return Utils.sortByNewest(
      Storage.getReceitas(),
      "data"
    );
  },

  /**
   * Retorna todos os gastos.
   */
  getExpenses() {
    return Utils.sortByNewest(
      Storage.getGastos(),
      "data"
    );
  },

  /**
   * Retorna receitas e gastos em uma única lista.
   */
  getAll() {
    return Utils.sortByNewest(
      [
        ...this.getIncomes(),
        ...this.getExpenses()
      ],
      "data"
    );
  },

  /**
   * Busca um lançamento pelo ID.
   */
  findById(transactionId, type = null) {
    if (!transactionId) {
      return null;
    }

    if (type) {
      const sectionName =
        this.getSectionName(type);

      return Storage.findItemById(
        sectionName,
        transactionId
      );
    }

    return (
      Storage.findItemById(
        "receitas",
        transactionId
      ) ||
      Storage.findItemById(
        "gastos",
        transactionId
      )
    );
  },

  /**
   * Edita um lançamento.
   */
  update(transactionId, changes, type = null) {
    const currentTransaction =
      this.findById(transactionId, type);

    if (!currentTransaction) {
      throw new Error(
        "Lançamento não encontrado."
      );
    }

    const currentType =
      currentTransaction.tipo ||
      type;

    const validatedData =
      this.validateTransactionData(
        {
          ...changes,
          tipo: currentType
        },
        currentTransaction
      );

    if (
      validatedData.tipo !== currentType
    ) {
      throw new Error(
        "Não é possível transformar uma receita em gasto ou um gasto em receita."
      );
    }

    const sectionName =
      this.getSectionName(currentType);

    return Storage.updateItem(
      sectionName,
      transactionId,
      {
        ...validatedData,
        atualizadoEm:
          new Date().toISOString()
      }
    );
  },

  /**
   * Exclui um lançamento.
   */
  delete(transactionId, type = null) {
    const transaction =
      this.findById(transactionId, type);

    if (!transaction) {
      return {
        success: false,
        error: "Lançamento não encontrado."
      };
    }

    const sectionName =
      this.getSectionName(
        transaction.tipo || type
      );

    const deleted = Storage.deleteItem(
      sectionName,
      transactionId
    );

    return {
      success: deleted,
      transaction: deleted
        ? Utils.clone(transaction)
        : null
    };
  },

  /**
   * Verifica se um lançamento realmente afeta
   * os totais financeiros.
   */
  isEffective(transaction) {
    if (!transaction) {
      return false;
    }

    if (transaction.tipo === "receita") {
      return transaction.status === "recebido";
    }

    return transaction.status === "pago";
  },

  /**
   * Filtra uma lista de lançamentos.
   */
  filter(transactions, filters = {}) {
    let result = Array.isArray(transactions)
      ? Utils.clone(transactions)
      : [];

    if (filters.tipo) {
      const type =
        this.normalizeType(filters.tipo);

      result = result.filter(
        item => item.tipo === type
      );
    }

    if (filters.categoriaId) {
      result = result.filter(
        item =>
          item.categoriaId ===
          filters.categoriaId
      );
    }

    if (filters.status) {
      result = result.filter(
        item =>
          item.status === filters.status
      );
    }

    if (filters.formaPagamento) {
      result = result.filter(
        item =>
          item.formaPagamento ===
          filters.formaPagamento
      );
    }

    if (filters.dataInicial) {
      result = result.filter(
        item =>
          item.data >= filters.dataInicial
      );
    }

    if (filters.dataFinal) {
      result = result.filter(
        item =>
          item.data <= filters.dataFinal
      );
    }

    if (
      filters.mes !== undefined &&
      filters.ano !== undefined
    ) {
      result = result.filter(
        item =>
          Utils.isDateInMonth(
            item.data,
            Number(filters.mes),
            Number(filters.ano)
          )
      );
    }

    if (filters.busca) {
      const searchText =
        this.normalizeText(
          filters.busca
        ).toLowerCase();

      result = result.filter(item => {
        const searchableText = [
          item.descricao,
          item.categoriaNome,
          item.origem,
          item.observacao,
          item.formaPagamento
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(
          searchText
        );
      });
    }

    if (filters.apenasEfetivos) {
      result = result.filter(
        item => this.isEffective(item)
      );
    }

    return Utils.sortByNewest(
      result,
      "data"
    );
  },

  /**
   * Retorna lançamentos de um mês específico.
   *
   * O mês deve seguir o padrão JavaScript:
   * janeiro = 0
   * fevereiro = 1
   * dezembro = 11
   */
  getByMonth(month, year, type = null) {
    const transactions = type
      ? type === "receita"
        ? this.getIncomes()
        : this.getExpenses()
      : this.getAll();

    return this.filter(transactions, {
      mes: Number(month),
      ano: Number(year)
    });
  },

  /**
   * Retorna lançamentos do mês atual.
   */
  getCurrentMonth(type = null) {
    const today = new Date();

    return this.getByMonth(
      today.getMonth(),
      today.getFullYear(),
      type
    );
  },

  /**
   * Retorna lançamentos de uma data.
   */
  getByDate(date, type = null) {
    if (!this.isValidDate(date)) {
      throw new Error(
        "A data informada é inválida."
      );
    }

    const transactions = type
      ? type === "receita"
        ? this.getIncomes()
        : this.getExpenses()
      : this.getAll();

    return transactions.filter(
      item => item.data === date
    );
  },

  /**
   * Soma os valores de uma lista.
   */
  sum(transactions, onlyEffective = true) {
    const validTransactions =
      onlyEffective
        ? transactions.filter(
            item => this.isEffective(item)
          )
        : transactions;

    return Utils.sumBy(
      validTransactions,
      "valor"
    );
  },

  /**
   * Calcula o total de receitas.
   */
  getIncomeTotal(transactions = null) {
    const incomes =
      transactions ||
      this.getIncomes();

    return this.sum(
      incomes.filter(
        item => item.tipo === "receita"
      )
    );
  },

  /**
   * Calcula o total de gastos.
   */
  getExpenseTotal(transactions = null) {
    const expenses =
      transactions ||
      this.getExpenses();

    return this.sum(
      expenses.filter(
        item => item.tipo === "gasto"
      )
    );
  },

  /**
   * Calcula o saldo pessoal.
   */
  getBalance(transactions = null) {
    const records =
      transactions ||
      this.getAll();

    return (
      this.getIncomeTotal(records) -
      this.getExpenseTotal(records)
    );
  },

  /**
   * Retorna o resumo do mês.
   */
  getMonthlySummary(
    month = new Date().getMonth(),
    year = new Date().getFullYear()
  ) {
    const transactions =
      this.getByMonth(month, year);

    const incomes = transactions.filter(
      item => item.tipo === "receita"
    );

    const expenses = transactions.filter(
      item => item.tipo === "gasto"
    );

    const incomeTotal =
      this.getIncomeTotal(incomes);

    const expenseTotal =
      this.getExpenseTotal(expenses);

    const balance =
      incomeTotal - expenseTotal;

    const savingsRate =
      incomeTotal > 0
        ? Utils.calculatePercentage(
            balance,
            incomeTotal
          )
        : 0;

    return {
      mes: month,
      ano: year,
      receitas: incomeTotal,
      gastos: expenseTotal,
      saldo: balance,
      economia: balance,
      taxaEconomia: savingsRate,
      quantidadeReceitas:
        incomes.length,
      quantidadeGastos:
        expenses.length,
      quantidadeLancamentos:
        transactions.length
    };
  },

  /**
   * Retorna o resumo do dia.
   */
  getDailySummary(
    date = Utils.getToday()
  ) {
    const transactions =
      this.getByDate(date);

    const incomes = transactions.filter(
      item => item.tipo === "receita"
    );

    const expenses = transactions.filter(
      item => item.tipo === "gasto"
    );

    const incomeTotal =
      this.getIncomeTotal(incomes);

    const expenseTotal =
      this.getExpenseTotal(expenses);

    return {
      data: date,
      receitas: incomeTotal,
      gastos: expenseTotal,
      saldo: incomeTotal - expenseTotal,
      quantidadeLancamentos:
        transactions.length
    };
  },

  /**
   * Agrupa gastos por categoria.
   */
  getExpensesByCategory(
    month = new Date().getMonth(),
    year = new Date().getFullYear()
  ) {
    const expenses = this.getByMonth(
      month,
      year,
      "gasto"
    ).filter(
      item => this.isEffective(item)
    );

    const totals = {};

    expenses.forEach(expense => {
      const categoryId =
        expense.categoriaId ||
        "sem-categoria";

      if (!totals[categoryId]) {
        const category =
          Categories.findById(
            categoryId,
            "gasto"
          );

        totals[categoryId] = {
          categoriaId: categoryId,
          categoriaNome:
            category?.nome ||
            expense.categoriaNome ||
            "Sem categoria",
          cor:
            category?.cor ||
            "#727786",
          total: 0,
          quantidade: 0
        };
      }

      totals[categoryId].total +=
        Number(expense.valor) || 0;

      totals[categoryId].quantidade += 1;
    });

    return Object.values(totals)
      .sort(
        (first, second) =>
          second.total - first.total
      );
  },

  /**
   * Retorna o status do limite diário.
   */
  getDailyLimitStatus(
    date = Utils.getToday()
  ) {
    const limits =
      Storage.getLimites() || {};

    const limit =
      Number(limits.diarioGeral) || 0;

    const expenses =
      this.getByDate(
        date,
        "gasto"
      ).filter(
        item => this.isEffective(item)
      );

    const used =
      this.getExpenseTotal(expenses);

    return this.buildLimitStatus(
      limit,
      used
    );
  },

  /**
   * Retorna o status do limite mensal geral.
   */
  getMonthlyLimitStatus(
    month = new Date().getMonth(),
    year = new Date().getFullYear()
  ) {
    const limits =
      Storage.getLimites() || {};

    const limit =
      Number(limits.mensalGeral) || 0;

    const expenses =
      this.getByMonth(
        month,
        year,
        "gasto"
      );

    const used =
      this.getExpenseTotal(expenses);

    return this.buildLimitStatus(
      limit,
      used
    );
  },

  /**
   * Retorna o status do limite de uma categoria.
   */
  getCategoryLimitStatus(
    categoryId,
    month = new Date().getMonth(),
    year = new Date().getFullYear()
  ) {
    const category =
      Categories.findById(
        categoryId,
        "gasto"
      );

    if (!category) {
      throw new Error(
        "Categoria de gasto não encontrada."
      );
    }

    const limit =
      Categories.getCategoryLimit(
        categoryId
      );

    const expenses =
      this.getByMonth(
        month,
        year,
        "gasto"
      ).filter(
        item =>
          item.categoriaId ===
          categoryId
      );

    const used =
      this.getExpenseTotal(expenses);

    return {
      categoriaId: category.id,
      categoriaNome: category.nome,
      cor: category.cor,
      ...this.buildLimitStatus(
        limit,
        used
      )
    };
  },

  /**
   * Retorna o status de todas as categorias.
   */
  getAllCategoryLimitStatuses(
    month = new Date().getMonth(),
    year = new Date().getFullYear()
  ) {
    return Categories.getGastos().map(
      category =>
        this.getCategoryLimitStatus(
          category.id,
          month,
          year
        )
    );
  },

  /**
   * Monta o status visual de um limite.
   */
  buildLimitStatus(limit, used) {
    const normalizedLimit =
      Number(limit) || 0;

    const normalizedUsed =
      Number(used) || 0;

    const remaining =
      normalizedLimit > 0
        ? normalizedLimit -
          normalizedUsed
        : 0;

    const percentage =
      normalizedLimit > 0
        ? Utils.calculatePercentage(
            normalizedUsed,
            normalizedLimit
          )
        : 0;

    let status = "sem-limite";

    if (normalizedLimit > 0) {
      if (percentage >= 100) {
        status = "excedido";
      } else if (percentage >= 80) {
        status = "alerta";
      } else {
        status = "normal";
      }
    }

    return {
      limite: normalizedLimit,
      utilizado: normalizedUsed,
      restante: remaining,
      percentual: percentage,
      status,
      excedido: normalizedUsed >
        normalizedLimit &&
        normalizedLimit > 0,
      valorExcedido:
        normalizedLimit > 0 &&
        normalizedUsed >
          normalizedLimit
          ? normalizedUsed -
            normalizedLimit
          : 0
    };
  },

  /**
   * Retorna os últimos lançamentos.
   */
  getRecent(limit = 5) {
    const numericLimit =
      Math.max(
        1,
        Number(limit) || 5
      );

    return this.getAll().slice(
      0,
      numericLimit
    );
  },

  /**
   * Retorna os maiores gastos de um período.
   */
  getLargestExpenses(
    limit = 5,
    month = null,
    year = null
  ) {
    let expenses;

    if (
      month !== null &&
      year !== null
    ) {
      expenses = this.getByMonth(
        month,
        year,
        "gasto"
      );
    } else {
      expenses = this.getExpenses();
    }

    return expenses
      .filter(
        item => this.isEffective(item)
      )
      .sort(
        (first, second) =>
          second.valor - first.valor
      )
      .slice(
        0,
        Math.max(
          1,
          Number(limit) || 5
        )
      );
  },

  /**
   * Retorna dados consolidados para o dashboard.
   */
  getDashboardData(
    month = new Date().getMonth(),
    year = new Date().getFullYear()
  ) {
    return {
      resumoMensal:
        this.getMonthlySummary(
          month,
          year
        ),

      limiteDiario:
        this.getDailyLimitStatus(),

      limiteMensal:
        this.getMonthlyLimitStatus(
          month,
          year
        ),

      gastosPorCategoria:
        this.getExpensesByCategory(
          month,
          year
        ),

      limitesPorCategoria:
        this.getAllCategoryLimitStatuses(
          month,
          year
        ),

      ultimosLancamentos:
        this.getRecent(5),

      maioresGastos:
        this.getLargestExpenses(
          5,
          month,
          year
        )
    };
  },

  /**
   * Inicializa o módulo.
   */
  initialize() {
    Storage.initialize();
    Categories.initialize();

    return {
      receitas: this.getIncomes(),
      gastos: this.getExpenses()
    };
  }
};

window.Expenses = Expenses;