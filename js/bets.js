/**
 * Gerenciamento de resultados de apostas.
 *
 * Categorias:
 * - pessoal
 * - palpiteiros
 *
 * O resultado pode ser informado diretamente:
 * resultado: 100
 * resultado: -50
 *
 * Também é possível informar investimento e retorno.
 * Nesse caso:
 * resultado = retorno - investimento
 */

const Bets = {
  VALID_CATEGORIES: [
    "pessoal",
    "palpiteiros"
  ],

  normalizeText(value) {
    return String(value || "")
      .trim()
      .replace(/\s+/g, " ");
  },

  normalizeValue(value) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return null;
    }

    if (typeof value === "number") {
      return value;
    }

    return Utils.parseCurrency(value);
  },

  normalizeCategory(category) {
    return String(category || "")
      .trim()
      .toLowerCase();
  },

  isValidCategory(category) {
    return this.VALID_CATEGORIES.includes(
      this.normalizeCategory(category)
    );
  },

  isValidDate(date) {
    const normalizedDate = String(date || "");

    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
      return false;
    }

    const parsedDate = new Date(
      `${normalizedDate}T12:00:00`
    );

    return !Number.isNaN(parsedDate.getTime());
  },

  getData() {
    const betsData = Storage.getBets();

    if (
      !betsData ||
      typeof betsData !== "object" ||
      Array.isArray(betsData)
    ) {
      return {
        bancaInicial: 0,
        depositos: [],
        saques: [],
        apostas: []
      };
    }

    return {
      bancaInicial:
        Number(betsData.bancaInicial) || 0,

      depositos: Array.isArray(
        betsData.depositos
      )
        ? Utils.clone(betsData.depositos)
        : [],

      saques: Array.isArray(
        betsData.saques
      )
        ? Utils.clone(betsData.saques)
        : [],

      apostas: Array.isArray(
        betsData.apostas
      )
        ? Utils.clone(betsData.apostas)
        : []
    };
  },

  saveData(betsData) {
    return Storage.updateSection(
      "bets",
      betsData
    );
  },

  validateBetData(
    betData,
    currentBet = null
  ) {
    if (
      !betData ||
      typeof betData !== "object"
    ) {
      throw new Error(
        "Os dados da aposta são inválidos."
      );
    }

    const date =
      betData.data ??
      currentBet?.data ??
      Utils.getToday();

    if (!this.isValidDate(date)) {
      throw new Error(
        "Informe uma data válida."
      );
    }

    const category =
      this.normalizeCategory(
        betData.categoria ??
        currentBet?.categoria
      );

    if (!this.isValidCategory(category)) {
      throw new Error(
        "A categoria deve ser pessoal ou palpiteiros."
      );
    }

    const investment =
      this.normalizeValue(
        betData.investimento ??
        currentBet?.investimento
      );

    const returnValue =
      this.normalizeValue(
        betData.retorno ??
        currentBet?.retorno
      );

    let result =
      this.normalizeValue(
        betData.resultado
      );

    if (
      result === null &&
      currentBet &&
      betData.investimento === undefined &&
      betData.retorno === undefined
    ) {
      result =
        Number(currentBet.resultado) || 0;
    }

    const hasInvestment =
      investment !== null;

    const hasReturn =
      returnValue !== null;

    if (
      hasInvestment &&
      (
        !Number.isFinite(investment) ||
        investment < 0
      )
    ) {
      throw new Error(
        "O investimento deve ser maior ou igual a zero."
      );
    }

    if (
      hasReturn &&
      (
        !Number.isFinite(returnValue) ||
        returnValue < 0
      )
    ) {
      throw new Error(
        "O retorno deve ser maior ou igual a zero."
      );
    }

    if (
      hasInvestment !== hasReturn
    ) {
      throw new Error(
        "Informe investimento e retorno juntos."
      );
    }

    if (
      hasInvestment &&
      hasReturn
    ) {
      result =
        returnValue - investment;
    }

    if (
      result === null ||
      !Number.isFinite(result)
    ) {
      throw new Error(
        "Informe um resultado válido."
      );
    }

    const bookmaker =
      this.normalizeText(
        betData.casa ??
        betData.bookmaker ??
        currentBet?.casa ??
        currentBet?.bookmaker ??
        ""
      );

    if (bookmaker.length > 80) {
      throw new Error(
        "O nome da casa deve ter no máximo 80 caracteres."
      );
    }

    const description =
      this.normalizeText(
        betData.descricao ??
        currentBet?.descricao ??
        ""
      );

    if (description.length > 150) {
      throw new Error(
        "A descrição deve ter no máximo 150 caracteres."
      );
    }

    const notes =
      this.normalizeText(
        betData.observacao ??
        currentBet?.observacao ??
        ""
      );

    if (notes.length > 500) {
      throw new Error(
        "A observação deve ter no máximo 500 caracteres."
      );
    }

    return {
      data: date,
      categoria: category,
      resultado: result,
      investimento:
        hasInvestment
          ? investment
          : null,
      retorno:
        hasReturn
          ? returnValue
          : null,
      casa: bookmaker,
      descricao: description,
      observacao: notes
    };
  },

  createBet(betData) {
    const validatedData =
      this.validateBetData(betData);

    const betsData = this.getData();

    const now =
      new Date().toISOString();

    const newBet = {
      id: Utils.generateId("bet"),
      ...validatedData,
      criadoEm: now,
      atualizadoEm: now
    };

    betsData.apostas.push(newBet);

    this.saveData(betsData);

    return Utils.clone(newBet);
  },

  create(betData) {
    return this.createBet(betData);
  },

  getBets() {
    return this.getData().apostas.sort(
      (firstBet, secondBet) => {
        const dateComparison =
          String(secondBet.data).localeCompare(
            String(firstBet.data)
          );

        if (dateComparison !== 0) {
          return dateComparison;
        }

        return String(
          secondBet.criadoEm || ""
        ).localeCompare(
          String(firstBet.criadoEm || "")
        );
      }
    );
  },

  findBetById(betId) {
    if (!betId) {
      return null;
    }

    const bet =
      this.getBets().find(
        currentBet =>
          currentBet.id === betId
      );

    return bet
      ? Utils.clone(bet)
      : null;
  },

  updateBet(betId, changes) {
    const betsData = this.getData();

    const betIndex =
      betsData.apostas.findIndex(
        bet => bet.id === betId
      );

    if (betIndex === -1) {
      throw new Error(
        "Aposta não encontrada."
      );
    }

    const currentBet =
      betsData.apostas[betIndex];

    const validatedData =
      this.validateBetData(
        changes,
        currentBet
      );

    const updatedBet = {
      ...currentBet,
      ...validatedData,
      id: currentBet.id,
      atualizadoEm:
        new Date().toISOString()
    };

    betsData.apostas[betIndex] =
      updatedBet;

    this.saveData(betsData);

    return Utils.clone(updatedBet);
  },

  deleteBet(betId) {
    const betsData = this.getData();

    const bet =
      betsData.apostas.find(
        currentBet =>
          currentBet.id === betId
      );

    if (!bet) {
      return {
        success: false,
        error: "Aposta não encontrada."
      };
    }

    betsData.apostas =
      betsData.apostas.filter(
        currentBet =>
          currentBet.id !== betId
      );

    this.saveData(betsData);

    return {
      success: true,
      bet: Utils.clone(bet)
    };
  },

  getBetsByCategory(category) {
    const normalizedCategory =
      this.normalizeCategory(category);

    if (
      !this.isValidCategory(
        normalizedCategory
      )
    ) {
      throw new Error(
        "Categoria de aposta inválida."
      );
    }

    return this.getBets().filter(
      bet =>
        bet.categoria ===
        normalizedCategory
    );
  },

  getBetsByDate(
    date,
    category = null
  ) {
    if (!this.isValidDate(date)) {
      throw new Error(
        "A data informada é inválida."
      );
    }

    let bets = this.getBets().filter(
      bet => bet.data === date
    );

    if (category !== null) {
      const normalizedCategory =
        this.normalizeCategory(category);

      if (
        !this.isValidCategory(
          normalizedCategory
        )
      ) {
        throw new Error(
          "Categoria de aposta inválida."
        );
      }

      bets = bets.filter(
        bet =>
          bet.categoria ===
          normalizedCategory
      );
    }

    return bets;
  },

  getBetsByMonth(
    month,
    year,
    category = null
  ) {
    const normalizedMonth =
      Number(month);

    const normalizedYear =
      Number(year);

    if (
      !Number.isInteger(normalizedMonth) ||
      normalizedMonth < 0 ||
      normalizedMonth > 11
    ) {
      throw new Error(
        "O mês informado é inválido."
      );
    }

    if (
      !Number.isInteger(normalizedYear) ||
      normalizedYear < 1900
    ) {
      throw new Error(
        "O ano informado é inválido."
      );
    }

    let bets = this.getBets().filter(
      bet =>
        Utils.isDateInMonth(
          bet.data,
          normalizedMonth,
          normalizedYear
        )
    );

    if (category !== null) {
      const normalizedCategory =
        this.normalizeCategory(category);

      if (
        !this.isValidCategory(
          normalizedCategory
        )
      ) {
        throw new Error(
          "Categoria de aposta inválida."
        );
      }

      bets = bets.filter(
        bet =>
          bet.categoria ===
          normalizedCategory
      );
    }

    return bets;
  },

  getCurrentMonthBets(
    category = null
  ) {
    const today = new Date();

    return this.getBetsByMonth(
      today.getMonth(),
      today.getFullYear(),
      category
    );
  },

  getTotalResult(bets = null) {
    const betList =
      bets || this.getBets();

    return betList.reduce(
      (total, bet) =>
        total +
        (Number(bet.resultado) || 0),
      0
    );
  },

  getTotalInvestment(bets = null) {
    const betList =
      bets || this.getBets();

    return betList.reduce(
      (total, bet) =>
        total +
        (Number(bet.investimento) || 0),
      0
    );
  },

  getTotalReturn(bets = null) {
    const betList =
      bets || this.getBets();

    return betList.reduce(
      (total, bet) =>
        total +
        (Number(bet.retorno) || 0),
      0
    );
  },

  calculateROI(
    totalResult,
    totalInvestment
  ) {
    if (totalInvestment <= 0) {
      return 0;
    }

    return (
      totalResult /
      totalInvestment
    ) * 100;
  },

  getBestBet(bets = null) {
    const betList =
      bets || this.getBets();

    if (!betList.length) {
      return null;
    }

    return Utils.clone(
      betList.reduce(
        (bestBet, currentBet) =>
          Number(currentBet.resultado) >
          Number(bestBet.resultado)
            ? currentBet
            : bestBet
      )
    );
  },

  getWorstBet(bets = null) {
    const betList =
      bets || this.getBets();

    if (!betList.length) {
      return null;
    }

    return Utils.clone(
      betList.reduce(
        (worstBet, currentBet) =>
          Number(currentBet.resultado) <
          Number(worstBet.resultado)
            ? currentBet
            : worstBet
      )
    );
  },

  buildReport(bets) {
    const betList =
      Array.isArray(bets)
        ? bets
        : [];

    const totalResult =
      this.getTotalResult(betList);

    const totalInvestment =
      this.getTotalInvestment(betList);

    const totalReturn =
      this.getTotalReturn(betList);

    const betCount =
      betList.length;

    const positiveBets =
      betList.filter(
        bet =>
          Number(bet.resultado) > 0
      ).length;

    const negativeBets =
      betList.filter(
        bet =>
          Number(bet.resultado) < 0
      ).length;

    const neutralBets =
      betList.filter(
        bet =>
          Number(bet.resultado) === 0
      ).length;

    return {
      quantidadeRegistros:
        betCount,

      resultado:
        totalResult,

      lucro:
        totalResult > 0
          ? totalResult
          : 0,

      prejuizo:
        totalResult < 0
          ? Math.abs(totalResult)
          : 0,

      investimento:
        totalInvestment,

      retorno:
        totalReturn,

      roi:
        this.calculateROI(
          totalResult,
          totalInvestment
        ),

      mediaDiaria:
        this.calculateDailyAverage(
          betList
        ),

      mediaPorRegistro:
        betCount > 0
          ? totalResult / betCount
          : 0,

      registrosPositivos:
        positiveBets,

      registrosNegativos:
        negativeBets,

      registrosNeutros:
        neutralBets,

      taxaDeAcerto:
        betCount > 0
          ? (
              positiveBets /
              betCount
            ) * 100
          : 0,

      melhorRegistro:
        this.getBestBet(betList),

      piorRegistro:
        this.getWorstBet(betList)
    };
  },

  calculateDailyAverage(bets) {
    if (!bets.length) {
      return 0;
    }

    const uniqueDates =
      new Set(
        bets.map(bet => bet.data)
      );

    if (!uniqueDates.size) {
      return 0;
    }

    return (
      this.getTotalResult(bets) /
      uniqueDates.size
    );
  },

  getDailyReport(
    date = Utils.getToday(),
    category = null
  ) {
    const bets =
      this.getBetsByDate(
        date,
        category
      );

    return {
      data: date,
      categoria:
        category
          ? this.normalizeCategory(
              category
            )
          : "total",
      ...this.buildReport(bets)
    };
  },

  getMonthlyReport(
    month = new Date().getMonth(),
    year = new Date().getFullYear(),
    category = null
  ) {
    const bets =
      this.getBetsByMonth(
        month,
        year,
        category
      );

    return {
      mes: Number(month),
      ano: Number(year),
      categoria:
        category
          ? this.normalizeCategory(
              category
            )
          : "total",
      ...this.buildReport(bets)
    };
  },

  getGeneralReport(
    category = null
  ) {
    const bets =
      category
        ? this.getBetsByCategory(
            category
          )
        : this.getBets();

    return {
      categoria:
        category
          ? this.normalizeCategory(
              category
            )
          : "total",
      ...this.buildReport(bets)
    };
  },

  getDailyResults(
    category = null,
    month = null,
    year = null
  ) {
    let bets;

    if (
      month !== null &&
      year !== null
    ) {
      bets = this.getBetsByMonth(
        month,
        year,
        category
      );
    } else if (category !== null) {
      bets =
        this.getBetsByCategory(
          category
        );
    } else {
      bets = this.getBets();
    }

    const groupedResults = {};

    bets.forEach(bet => {
      if (!groupedResults[bet.data]) {
        groupedResults[bet.data] = {
          data: bet.data,
          resultado: 0,
          investimento: 0,
          retorno: 0,
          quantidadeRegistros: 0
        };
      }

      groupedResults[bet.data]
        .resultado +=
        Number(bet.resultado) || 0;

      groupedResults[bet.data]
        .investimento +=
        Number(bet.investimento) || 0;

      groupedResults[bet.data]
        .retorno +=
        Number(bet.retorno) || 0;

      groupedResults[bet.data]
        .quantidadeRegistros += 1;
    });

    return Object.values(
      groupedResults
    ).sort(
      (firstDay, secondDay) =>
        firstDay.data.localeCompare(
          secondDay.data
        )
    );
  },

  getAccumulatedEvolution(
    category = null,
    month = null,
    year = null
  ) {
    const dailyResults =
      this.getDailyResults(
        category,
        month,
        year
      );

    let accumulatedResult = 0;

    return dailyResults.map(day => {
      accumulatedResult +=
        day.resultado;

      return {
        ...day,
        resultadoAcumulado:
          accumulatedResult
      };
    });
  },

  getMonthlyEvolution(
    category = null
  ) {
    const bets =
      category
        ? this.getBetsByCategory(
            category
          )
        : this.getBets();

    const groupedMonths = {};

    bets.forEach(bet => {
      const monthKey =
        String(bet.data).slice(0, 7);

      if (!groupedMonths[monthKey]) {
        groupedMonths[monthKey] = {
          periodo: monthKey,
          ano: Number(
            monthKey.slice(0, 4)
          ),
          mes:
            Number(
              monthKey.slice(5, 7)
            ) - 1,
          resultado: 0,
          investimento: 0,
          retorno: 0,
          quantidadeRegistros: 0
        };
      }

      groupedMonths[monthKey]
        .resultado +=
        Number(bet.resultado) || 0;

      groupedMonths[monthKey]
        .investimento +=
        Number(bet.investimento) || 0;

      groupedMonths[monthKey]
        .retorno +=
        Number(bet.retorno) || 0;

      groupedMonths[monthKey]
        .quantidadeRegistros += 1;
    });

    let accumulatedResult = 0;

    return Object.values(
      groupedMonths
    )
      .sort(
        (firstMonth, secondMonth) =>
          firstMonth.periodo.localeCompare(
            secondMonth.periodo
          )
      )
      .map(month => {
        accumulatedResult +=
          month.resultado;

        return {
          ...month,

          roi: this.calculateROI(
            month.resultado,
            month.investimento
          ),

          resultadoAcumulado:
            accumulatedResult
        };
      });
  },

  setInitialBankroll(value) {
    const bankroll =
      this.normalizeValue(value);

    if (
      !Number.isFinite(bankroll) ||
      bankroll < 0
    ) {
      throw new Error(
        "A banca inicial deve ser maior ou igual a zero."
      );
    }

    const betsData = this.getData();

    betsData.bancaInicial =
      bankroll;

    this.saveData(betsData);

    return bankroll;
  },

  getCurrentBankroll() {
    const betsData = this.getData();

    return (
      betsData.bancaInicial +
      this.getTotalResult()
    );
  },

  getRecentBets(
    limit = 5,
    category = null
  ) {
    const normalizedLimit =
      Math.max(
        1,
        Number(limit) || 5
      );

    const bets =
      category
        ? this.getBetsByCategory(
            category
          )
        : this.getBets();

    return bets.slice(
      0,
      normalizedLimit
    );
  },

  getDashboardData(
    month = new Date().getMonth(),
    year = new Date().getFullYear()
  ) {
    return {
      bancaInicial:
        this.getData().bancaInicial,

      bancaAtual:
        this.getCurrentBankroll(),

      mensal: {
        total:
          this.getMonthlyReport(
            month,
            year
          ),

        pessoal:
          this.getMonthlyReport(
            month,
            year,
            "pessoal"
          ),

        palpiteiros:
          this.getMonthlyReport(
            month,
            year,
            "palpiteiros"
          )
      },

      geral: {
        total:
          this.getGeneralReport(),

        pessoal:
          this.getGeneralReport(
            "pessoal"
          ),

        palpiteiros:
          this.getGeneralReport(
            "palpiteiros"
          )
      },

      evolucaoDiaria: {
        total:
          this.getAccumulatedEvolution(
            null,
            month,
            year
          ),

        pessoal:
          this.getAccumulatedEvolution(
            "pessoal",
            month,
            year
          ),

        palpiteiros:
          this.getAccumulatedEvolution(
            "palpiteiros",
            month,
            year
          )
      },

      evolucaoMensal: {
        total:
          this.getMonthlyEvolution(),

        pessoal:
          this.getMonthlyEvolution(
            "pessoal"
          ),

        palpiteiros:
          this.getMonthlyEvolution(
            "palpiteiros"
          )
      },

      ultimosRegistros:
        this.getRecentBets(5)
    };
  },

  initialize() {
    Storage.initialize();

    const betsData = this.getData();

    this.saveData(betsData);

    return {
      bancaInicial:
        betsData.bancaInicial,

      quantidadeRegistros:
        betsData.apostas.length,

      relatorioGeral:
        this.getGeneralReport()
    };
  }
};

window.Bets = Bets;