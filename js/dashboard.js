/**
 * Módulo responsável por reunir os dados de:
 *
 * - Receitas
 * - Gastos
 * - Poker
 * - Bets
 *
 * Este arquivo prepara as informações para a interface
 * e para os gráficos, mas não altera nenhum registro.
 */

const Dashboard = {
  /**
   * Retorna mês e ano atuais.
   *
   * Janeiro = 0
   * Dezembro = 11
   */
  getCurrentPeriod() {
    const today = new Date();

    return {
      month: today.getMonth(),
      year: today.getFullYear()
    };
  },

  /**
   * Valida mês e ano.
   */
  validatePeriod(month, year) {
    const normalizedMonth = Number(month);
    const normalizedYear = Number(year);

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

    return {
      month: normalizedMonth,
      year: normalizedYear
    };
  },

  /**
   * Retorna o nome do mês.
   */
  getMonthName(month) {
    const monthNames = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro"
    ];

    return monthNames[month] || "";
  },

  /**
   * Garante que o valor seja numérico.
   */
  toNumber(value) {
    const number = Number(value);

    return Number.isFinite(number)
      ? number
      : 0;
  },

  /**
   * Busca dados financeiros pessoais.
   */
  getPersonalFinanceData(month, year) {
    try {
      const data =
        Expenses.getDashboardData(
          month,
          year
        );

      return data || {};
    } catch (error) {
      console.error(
        "Erro ao carregar dados financeiros:",
        error
      );

      return {};
    }
  },

  /**
   * Busca dados do Poker.
   */
  getPokerData(month, year) {
    try {
      const data =
        Poker.getDashboardData(
          month,
          year
        );

      return data || {};
    } catch (error) {
      console.error(
        "Erro ao carregar dados do Poker:",
        error
      );

      return {
        bancaInicial: 0,
        bancaAtual: 0,
        relatorioMensal: {},
        relatorioGeral: {},
        resultadosDiarios: [],
        evolucaoMensal: [],
        evolucaoAcumulada: [],
        ultimasSessoes: []
      };
    }
  },

  /**
   * Busca dados das Bets.
   */
  getBetsData(month, year) {
    try {
      const data =
        Bets.getDashboardData(
          month,
          year
        );

      return data || {};
    } catch (error) {
      console.error(
        "Erro ao carregar dados das Bets:",
        error
      );

      return {
        bancaInicial: 0,
        bancaAtual: 0,
        mensal: {
          total: {},
          pessoal: {},
          palpiteiros: {}
        },
        geral: {
          total: {},
          pessoal: {},
          palpiteiros: {}
        },
        evolucaoDiaria: {
          total: [],
          pessoal: [],
          palpiteiros: []
        },
        evolucaoMensal: {
          total: [],
          pessoal: [],
          palpiteiros: []
        },
        ultimosRegistros: []
      };
    }
  },

  /**
   * Extrai receitas mensais do módulo Expenses.
   *
   * Foram incluídas diferentes possibilidades
   * de nomes para manter compatibilidade.
   */
  getMonthlyIncome(financeData) {
    return this.toNumber(
      financeData.totalReceitas ??
      financeData.receitas ??
      financeData.receitasMes ??
      financeData.resumoMensal?.receitas ??
      financeData.monthlySummary?.receitas ??
      0
    );
  },

  /**
   * Extrai gastos mensais do módulo Expenses.
   */
  getMonthlyExpenses(financeData) {
    return this.toNumber(
      financeData.totalGastos ??
      financeData.gastos ??
      financeData.gastosMes ??
      financeData.resumoMensal?.gastos ??
      financeData.monthlySummary?.gastos ??
      0
    );
  },

  /**
   * Extrai o saldo pessoal mensal.
   */
  getMonthlyPersonalBalance(
    financeData,
    monthlyIncome,
    monthlyExpenses
  ) {
    const savedBalance =
      financeData.saldo ??
      financeData.saldoMes ??
      financeData.resumoMensal?.saldo ??
      financeData.monthlySummary?.saldo;

    if (
      savedBalance !== undefined &&
      savedBalance !== null
    ) {
      return this.toNumber(savedBalance);
    }

    return monthlyIncome - monthlyExpenses;
  },

  /**
   * Retorna o resultado mensal do Poker.
   */
  getMonthlyPokerResult(pokerData) {
    return this.toNumber(
      pokerData.relatorioMensal?.resultado
    );
  },

  /**
   * Retorna o resultado geral do Poker.
   */
  getGeneralPokerResult(pokerData) {
    return this.toNumber(
      pokerData.relatorioGeral?.resultado
    );
  },

  /**
   * Retorna o resultado mensal total das Bets.
   */
  getMonthlyBetsResult(betsData) {
    return this.toNumber(
      betsData.mensal?.total?.resultado
    );
  },

  /**
   * Retorna o resultado geral total das Bets.
   */
  getGeneralBetsResult(betsData) {
    return this.toNumber(
      betsData.geral?.total?.resultado
    );
  },

  /**
   * Calcula o saldo combinado do mês.
   *
   * Saldo combinado:
   *
   * saldo pessoal
   * + resultado Poker
   * + resultado Bets
   */
  calculateCombinedMonthlyBalance({
    personalBalance,
    pokerResult,
    betsResult
  }) {
    return (
      this.toNumber(personalBalance) +
      this.toNumber(pokerResult) +
      this.toNumber(betsResult)
    );
  },

  /**
   * Retorna um resumo principal do mês.
   */
  buildMonthlySummary(
    financeData,
    pokerData,
    betsData
  ) {
    const income =
      this.getMonthlyIncome(financeData);

    const expenses =
      this.getMonthlyExpenses(financeData);

    const personalBalance =
      this.getMonthlyPersonalBalance(
        financeData,
        income,
        expenses
      );

    const pokerResult =
      this.getMonthlyPokerResult(
        pokerData
      );

    const betsResult =
      this.getMonthlyBetsResult(
        betsData
      );

    const combinedBalance =
      this.calculateCombinedMonthlyBalance({
        personalBalance,
        pokerResult,
        betsResult
      });

    return {
      receitas: income,
      gastos: expenses,
      saldoPessoal: personalBalance,

      poker: pokerResult,
      bets: betsResult,

      saldoCombinado: combinedBalance,

      entradasTotais:
        income +
        Math.max(pokerResult, 0) +
        Math.max(betsResult, 0),

      saidasTotais:
        expenses +
        Math.abs(
          Math.min(pokerResult, 0)
        ) +
        Math.abs(
          Math.min(betsResult, 0)
        )
    };
  },

  /**
   * Retorna os resultados detalhados de Poker.
   */
  buildPokerSummary(pokerData) {
    const monthlyReport =
      pokerData.relatorioMensal || {};

    const generalReport =
      pokerData.relatorioGeral || {};

    return {
      bancaInicial:
        this.toNumber(
          pokerData.bancaInicial
        ),

      bancaAtual:
        this.toNumber(
          pokerData.bancaAtual
        ),

      mensal: {
        sessoes:
          this.toNumber(
            monthlyReport.quantidadeSessoes
          ),

        buyIns:
          this.toNumber(
            monthlyReport.totalBuyIns
          ),

        retorno:
          this.toNumber(
            monthlyReport.totalRetornado
          ),

        resultado:
          this.toNumber(
            monthlyReport.resultado
          ),

        roi:
          this.toNumber(
            monthlyReport.roi
          ),

        media:
          this.toNumber(
            monthlyReport.mediaPorSessao
          ),

        melhorSessao:
          monthlyReport.melhorSessao ||
          null,

        piorSessao:
          monthlyReport.piorSessao ||
          null
      },

      geral: {
        sessoes:
          this.toNumber(
            generalReport.quantidadeSessoes
          ),

        buyIns:
          this.toNumber(
            generalReport.totalBuyIns
          ),

        retorno:
          this.toNumber(
            generalReport.totalRetornado
          ),

        resultado:
          this.toNumber(
            generalReport.resultado
          ),

        roi:
          this.toNumber(
            generalReport.roi
          ),

        media:
          this.toNumber(
            generalReport.mediaPorSessao
          ),

        melhorSessao:
          generalReport.melhorSessao ||
          null,

        piorSessao:
          generalReport.piorSessao ||
          null
      }
    };
  },

  /**
   * Retorna os resultados detalhados das Bets.
   */
  buildBetsSummary(betsData) {
    const monthly =
      betsData.mensal || {};

    const general =
      betsData.geral || {};

    return {
      bancaInicial:
        this.toNumber(
          betsData.bancaInicial
        ),

      bancaAtual:
        this.toNumber(
          betsData.bancaAtual
        ),

      mensal: {
        total:
          monthly.total || {},

        pessoal:
          monthly.pessoal || {},

        palpiteiros:
          monthly.palpiteiros || {}
      },

      geral: {
        total:
          general.total || {},

        pessoal:
          general.pessoal || {},

        palpiteiros:
          general.palpiteiros || {}
      }
    };
  },

  /**
   * Retorna alertas importantes para o Dashboard.
   */
  buildAlerts(
    financeData,
    pokerData,
    betsData
  ) {
    const alerts = [];

    const dailyLimit =
      financeData.limiteDiario ??
      financeData.statusLimiteDiario ??
      financeData.dailyLimitStatus;

    const monthlyLimit =
      financeData.limiteMensal ??
      financeData.statusLimiteMensal ??
      financeData.monthlyLimitStatus;

    if (
      dailyLimit?.excedido === true ||
      dailyLimit?.isExceeded === true
    ) {
      alerts.push({
        id: "daily-limit",
        type: "danger",
        title: "Limite diário excedido",
        message:
          "Os gastos de hoje ultrapassaram o limite definido."
      });
    }

    if (
      monthlyLimit?.excedido === true ||
      monthlyLimit?.isExceeded === true
    ) {
      alerts.push({
        id: "monthly-limit",
        type: "danger",
        title: "Limite mensal excedido",
        message:
          "Os gastos do mês ultrapassaram o limite definido."
      });
    }

    const monthlyPokerResult =
      this.getMonthlyPokerResult(
        pokerData
      );

    if (monthlyPokerResult < 0) {
      alerts.push({
        id: "poker-negative",
        type: "warning",
        title: "Poker negativo no mês",
        message:
          `O resultado mensal do Poker está em ${Utils.formatCurrency(
            monthlyPokerResult
          )}.`
      });
    }

    const monthlyBetsResult =
      this.getMonthlyBetsResult(
        betsData
      );

    if (monthlyBetsResult < 0) {
      alerts.push({
        id: "bets-negative",
        type: "warning",
        title: "Bets negativas no mês",
        message:
          `O resultado mensal das Bets está em ${Utils.formatCurrency(
            monthlyBetsResult
          )}.`
      });
    }

    return alerts;
  },

  /**
   * Retorna os registros mais recentes de
   * todos os módulos.
   */
  getRecentActivity(
    financeData,
    pokerData,
    betsData,
    limit = 10
  ) {
    const activities = [];

    const recentIncomes =
      financeData.ultimasReceitas ??
      financeData.receitasRecentes ??
      [];

    const recentExpenses =
      financeData.ultimosGastos ??
      financeData.gastosRecentes ??
      [];

    recentIncomes.forEach(income => {
      activities.push({
        id: income.id,
        type: "receita",
        title:
          income.descricao ||
          "Receita",

        date: income.data,

        value:
          this.toNumber(
            income.valor
          ),

        result:
          this.toNumber(
            income.valor
          ),

        data: income
      });
    });

    recentExpenses.forEach(expense => {
      activities.push({
        id: expense.id,
        type: "gasto",
        title:
          expense.descricao ||
          "Gasto",

        date: expense.data,

        value:
          this.toNumber(
            expense.valor
          ),

        result:
          -Math.abs(
            this.toNumber(
              expense.valor
            )
          ),

        data: expense
      });
    });

    (
      pokerData.ultimasSessoes || []
    ).forEach(session => {
      activities.push({
        id: session.id,
        type: "poker",
        title:
          session.descricao ||
          "Sessão de Poker",

        date: session.data,

        value:
          this.toNumber(
            session.buyIn
          ),

        result:
          this.toNumber(
            session.resultado
          ),

        data: session
      });
    });

    (
      betsData.ultimosRegistros || []
    ).forEach(bet => {
      activities.push({
        id: bet.id,
        type:
          bet.categoria ===
          "palpiteiros"
            ? "bets-palpiteiros"
            : "bets-pessoal",

        title:
          bet.descricao ||
          "Resultado de Bets",

        date: bet.data,

        value:
          this.toNumber(
            bet.investimento
          ),

        result:
          this.toNumber(
            bet.resultado
          ),

        data: bet
      });
    });

    return activities
      .sort((first, second) => {
        const dateComparison =
          String(second.date || "")
            .localeCompare(
              String(first.date || "")
            );

        if (dateComparison !== 0) {
          return dateComparison;
        }

        const firstCreated =
          first.data?.criadoEm || "";

        const secondCreated =
          second.data?.criadoEm || "";

        return String(secondCreated)
          .localeCompare(
            String(firstCreated)
          );
      })
      .slice(
        0,
        Math.max(
          1,
          Number(limit) || 10
        )
      );
  },

  /**
   * Retorna os dados preparados para gráficos.
   */
  getChartData(
    financeData,
    pokerData,
    betsData
  ) {
    return {
      gastosPorCategoria:
        financeData.gastosPorCategoria ??
        financeData.expensesByCategory ??
        [],

      fluxoMensal:
        financeData.fluxoMensal ??
        financeData.monthlyFlow ??
        [],

      pokerDiario:
        pokerData.resultadosDiarios ||
        [],

      pokerAcumulado:
        pokerData.evolucaoAcumulada ||
        [],

      pokerMensal:
        pokerData.evolucaoMensal ||
        [],

      betsDiario: {
        total:
          betsData.evolucaoDiaria?.total ||
          [],

        pessoal:
          betsData.evolucaoDiaria?.pessoal ||
          [],

        palpiteiros:
          betsData.evolucaoDiaria
            ?.palpiteiros || []
      },

      betsMensal: {
        total:
          betsData.evolucaoMensal?.total ||
          [],

        pessoal:
          betsData.evolucaoMensal?.pessoal ||
          [],

        palpiteiros:
          betsData.evolucaoMensal
            ?.palpiteiros || []
      }
    };
  },

  /**
   * Monta o objeto completo do Dashboard.
   */
  getData(
    month = new Date().getMonth(),
    year = new Date().getFullYear()
  ) {
    const period =
      this.validatePeriod(
        month,
        year
      );

    const financeData =
      this.getPersonalFinanceData(
        period.month,
        period.year
      );

    const pokerData =
      this.getPokerData(
        period.month,
        period.year
      );

    const betsData =
      this.getBetsData(
        period.month,
        period.year
      );

    return {
      periodo: {
        mes: period.month,
        ano: period.year,

        nomeMes:
          this.getMonthName(
            period.month
          ),

        descricao:
          `${this.getMonthName(
            period.month
          )} de ${period.year}`
      },

      resumo:
        this.buildMonthlySummary(
          financeData,
          pokerData,
          betsData
        ),

      financas:
        financeData,

      poker:
        this.buildPokerSummary(
          pokerData
        ),

      bets:
        this.buildBetsSummary(
          betsData
        ),

      alertas:
        this.buildAlerts(
          financeData,
          pokerData,
          betsData
        ),

      atividadesRecentes:
        this.getRecentActivity(
          financeData,
          pokerData,
          betsData
        ),

      graficos:
        this.getChartData(
          financeData,
          pokerData,
          betsData
        ),

      atualizadoEm:
        new Date().toISOString()
    };
  },

  /**
   * Atalho para o mês atual.
   */
  getCurrentMonthData() {
    const period =
      this.getCurrentPeriod();

    return this.getData(
      period.month,
      period.year
    );
  },

  /**
   * Inicializa todos os módulos necessários.
   */
  initialize() {
    Storage.initialize();

    if (
      typeof Categories !== "undefined"
    ) {
      Categories.initialize?.();
    }

    if (
      typeof Expenses !== "undefined"
    ) {
      Expenses.initialize?.();
    }

    if (
      typeof Poker !== "undefined"
    ) {
      Poker.initialize();
    }

    if (
      typeof Bets !== "undefined"
    ) {
      Bets.initialize();
    }

    return this.getCurrentMonthData();
  }
};

window.Dashboard = Dashboard;