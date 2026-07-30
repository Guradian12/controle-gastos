/**
 * Gerenciamento dos resultados de Poker.
 *
 * Cada registro representa uma sessão ou torneio.
 *
 * Resultado:
 * retorno - buy-in
 *
 * Exemplos:
 * Buy-in 100 e retorno 0   = -100
 * Buy-in 100 e retorno 250 = +150
 */

const Poker = {
  /**
   * Normaliza textos.
   */
  normalizeText(value) {
    return String(value || "")
      .trim()
      .replace(/\s+/g, " ");
  },

  /**
   * Converte valores monetários para número.
   */
  normalizeValue(value) {
    if (typeof value === "number") {
      return value;
    }

    return Utils.parseCurrency(value);
  },

  /**
   * Verifica uma data no formato YYYY-MM-DD.
   */
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

  /**
   * Retorna a estrutura completa de Poker.
   */
  getData() {
    const pokerData = Storage.getPoker();

    if (
      !pokerData ||
      typeof pokerData !== "object" ||
      Array.isArray(pokerData)
    ) {
      return {
        bancaInicial: 0,
        depositos: [],
        saques: [],
        sessoes: []
      };
    }

    return {
      bancaInicial:
        Number(pokerData.bancaInicial) || 0,

      depositos: Array.isArray(pokerData.depositos)
        ? Utils.clone(pokerData.depositos)
        : [],

      saques: Array.isArray(pokerData.saques)
        ? Utils.clone(pokerData.saques)
        : [],

      sessoes: Array.isArray(pokerData.sessoes)
        ? Utils.clone(pokerData.sessoes)
        : []
    };
  },

  /**
   * Salva a estrutura completa de Poker.
   */
  saveData(pokerData) {
    return Storage.updateSection(
      "poker",
      pokerData
    );
  },

  /**
   * Valida e normaliza os dados de uma sessão.
   */
  validateSessionData(
    sessionData,
    currentSession = null
  ) {
    if (
      !sessionData ||
      typeof sessionData !== "object"
    ) {
      throw new Error(
        "Os dados da sessão são inválidos."
      );
    }

    const date =
      sessionData.data ??
      currentSession?.data ??
      Utils.getToday();

    if (!this.isValidDate(date)) {
      throw new Error(
        "Informe uma data válida."
      );
    }

    const buyIn = this.normalizeValue(
      sessionData.buyIn ??
      sessionData.buyin ??
      currentSession?.buyIn ??
      currentSession?.buyin ??
      0
    );

    if (
      !Number.isFinite(buyIn) ||
      buyIn <= 0
    ) {
      throw new Error(
        "O buy-in deve ser maior que zero."
      );
    }

    const returnValue = this.normalizeValue(
      sessionData.retorno ??
      sessionData.cashout ??
      currentSession?.retorno ??
      currentSession?.cashout ??
      0
    );

    if (
      !Number.isFinite(returnValue) ||
      returnValue < 0
    ) {
      throw new Error(
        "O retorno deve ser maior ou igual a zero."
      );
    }

    const description = this.normalizeText(
      sessionData.descricao ??
      currentSession?.descricao ??
      ""
    );

    if (description.length > 100) {
      throw new Error(
        "A descrição deve ter no máximo 100 caracteres."
      );
    }

    const location = this.normalizeText(
      sessionData.local ??
      currentSession?.local ??
      ""
    );

    if (location.length > 80) {
      throw new Error(
        "O local deve ter no máximo 80 caracteres."
      );
    }

    const notes = this.normalizeText(
      sessionData.observacao ??
      currentSession?.observacao ??
      ""
    );

    if (notes.length > 500) {
      throw new Error(
        "A observação deve ter no máximo 500 caracteres."
      );
    }

    const result = returnValue - buyIn;

    return {
      data: date,
      buyIn,
      retorno: returnValue,
      resultado: result,
      descricao: description,
      local: location,
      observacao: notes
    };
  },

  /**
   * Cria uma nova sessão.
   */
  createSession(sessionData) {
    const validatedData =
      this.validateSessionData(sessionData);

    const pokerData = this.getData();

    const now = new Date().toISOString();

    const newSession = {
      id: Utils.generateId("poker"),
      ...validatedData,
      criadoEm: now,
      atualizadoEm: now
    };

    pokerData.sessoes.push(newSession);

    this.saveData(pokerData);

    return Utils.clone(newSession);
  },

  /**
   * Retorna todas as sessões, da mais recente
   * para a mais antiga.
   */
  getSessions() {
    return this.getData().sessoes.sort(
      (firstSession, secondSession) => {
        const dateComparison =
          String(secondSession.data).localeCompare(
            String(firstSession.data)
          );

        if (dateComparison !== 0) {
          return dateComparison;
        }

        return String(
          secondSession.criadoEm || ""
        ).localeCompare(
          String(firstSession.criadoEm || "")
        );
      }
    );
  },

  /**
   * Busca uma sessão pelo ID.
   */
  findSessionById(sessionId) {
    if (!sessionId) {
      return null;
    }

    const session = this.getSessions().find(
      currentSession =>
        currentSession.id === sessionId
    );

    return session
      ? Utils.clone(session)
      : null;
  },

  /**
   * Edita uma sessão.
   */
  updateSession(sessionId, changes) {
    const pokerData = this.getData();

    const sessionIndex =
      pokerData.sessoes.findIndex(
        session => session.id === sessionId
      );

    if (sessionIndex === -1) {
      throw new Error(
        "Sessão de Poker não encontrada."
      );
    }

    const currentSession =
      pokerData.sessoes[sessionIndex];

    const validatedData =
      this.validateSessionData(
        changes,
        currentSession
      );

    const updatedSession = {
      ...currentSession,
      ...validatedData,
      id: currentSession.id,
      atualizadoEm:
        new Date().toISOString()
    };

    pokerData.sessoes[sessionIndex] =
      updatedSession;

    this.saveData(pokerData);

    return Utils.clone(updatedSession);
  },

  /**
   * Exclui uma sessão.
   */
  deleteSession(sessionId) {
    const pokerData = this.getData();

    const session =
      pokerData.sessoes.find(
        currentSession =>
          currentSession.id === sessionId
      );

    if (!session) {
      return {
        success: false,
        error: "Sessão de Poker não encontrada."
      };
    }

    pokerData.sessoes =
      pokerData.sessoes.filter(
        currentSession =>
          currentSession.id !== sessionId
      );

    this.saveData(pokerData);

    return {
      success: true,
      session: Utils.clone(session)
    };
  },

  /**
   * Retorna as sessões de uma data.
   */
  getSessionsByDate(date) {
    if (!this.isValidDate(date)) {
      throw new Error(
        "A data informada é inválida."
      );
    }

    return this.getSessions().filter(
      session => session.data === date
    );
  },

  /**
   * Retorna as sessões de um mês.
   *
   * Janeiro = 0
   * Fevereiro = 1
   * Dezembro = 11
   */
  getSessionsByMonth(
    month,
    year
  ) {
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

    return this.getSessions().filter(
      session =>
        Utils.isDateInMonth(
          session.data,
          normalizedMonth,
          normalizedYear
        )
    );
  },

  /**
   * Retorna as sessões do mês atual.
   */
  getCurrentMonthSessions() {
    const today = new Date();

    return this.getSessionsByMonth(
      today.getMonth(),
      today.getFullYear()
    );
  },

  /**
   * Calcula o total de buy-ins.
   */
  getTotalBuyIns(sessions = null) {
    const sessionList =
      sessions || this.getSessions();

    return sessionList.reduce(
      (total, session) =>
        total +
        (Number(session.buyIn) || 0),
      0
    );
  },

  /**
   * Calcula o total retornado.
   */
  getTotalReturns(sessions = null) {
    const sessionList =
      sessions || this.getSessions();

    return sessionList.reduce(
      (total, session) =>
        total +
        (Number(session.retorno) || 0),
      0
    );
  },

  /**
   * Calcula o resultado total.
   */
  getTotalResult(sessions = null) {
    const sessionList =
      sessions || this.getSessions();

    return sessionList.reduce(
      (total, session) =>
        total +
        (Number(session.resultado) || 0),
      0
    );
  },

  /**
   * Calcula o ROI.
   *
   * ROI = resultado ÷ buy-ins × 100
   */
  calculateROI(
    totalResult,
    totalBuyIns
  ) {
    if (totalBuyIns <= 0) {
      return 0;
    }

    return (
      totalResult /
      totalBuyIns
    ) * 100;
  },

  /**
   * Encontra a melhor sessão.
   */
  getBestSession(sessions = null) {
    const sessionList =
      sessions || this.getSessions();

    if (!sessionList.length) {
      return null;
    }

    return Utils.clone(
      sessionList.reduce(
        (bestSession, currentSession) =>
          Number(currentSession.resultado) >
          Number(bestSession.resultado)
            ? currentSession
            : bestSession
      )
    );
  },

  /**
   * Encontra a pior sessão.
   */
  getWorstSession(sessions = null) {
    const sessionList =
      sessions || this.getSessions();

    if (!sessionList.length) {
      return null;
    }

    return Utils.clone(
      sessionList.reduce(
        (worstSession, currentSession) =>
          Number(currentSession.resultado) <
          Number(worstSession.resultado)
            ? currentSession
            : worstSession
      )
    );
  },

  /**
   * Monta um relatório para uma lista de sessões.
   */
  buildReport(sessions) {
    const sessionList =
      Array.isArray(sessions)
        ? sessions
        : [];

    const totalBuyIns =
      this.getTotalBuyIns(sessionList);

    const totalReturns =
      this.getTotalReturns(sessionList);

    const totalResult =
      this.getTotalResult(sessionList);

    const sessionCount =
      sessionList.length;

    const profitableSessions =
      sessionList.filter(
        session =>
          Number(session.resultado) > 0
      ).length;

    const losingSessions =
      sessionList.filter(
        session =>
          Number(session.resultado) < 0
      ).length;

    const breakEvenSessions =
      sessionList.filter(
        session =>
          Number(session.resultado) === 0
      ).length;

    const averageResult =
      sessionCount > 0
        ? totalResult / sessionCount
        : 0;

    const hitRate =
      sessionCount > 0
        ? (
            profitableSessions /
            sessionCount
          ) * 100
        : 0;

    return {
      quantidadeSessoes: sessionCount,

      totalBuyIns,
      totalRetornado: totalReturns,
      resultado: totalResult,

      lucro: totalResult > 0
        ? totalResult
        : 0,

      prejuizo: totalResult < 0
        ? Math.abs(totalResult)
        : 0,

      roi: this.calculateROI(
        totalResult,
        totalBuyIns
      ),

      mediaPorSessao: averageResult,

      sessoesPositivas:
        profitableSessions,

      sessoesNegativas:
        losingSessions,

      sessoesNeutras:
        breakEvenSessions,

      taxaDeLucro: hitRate,

      melhorSessao:
        this.getBestSession(sessionList),

      piorSessao:
        this.getWorstSession(sessionList)
    };
  },

  /**
   * Retorna o relatório de uma data.
   */
  getDailyReport(
    date = Utils.getToday()
  ) {
    const sessions =
      this.getSessionsByDate(date);

    return {
      data: date,
      ...this.buildReport(sessions)
    };
  },

  /**
   * Retorna o relatório mensal.
   */
  getMonthlyReport(
    month = new Date().getMonth(),
    year = new Date().getFullYear()
  ) {
    const sessions =
      this.getSessionsByMonth(
        month,
        year
      );

    return {
      mes: Number(month),
      ano: Number(year),
      ...this.buildReport(sessions)
    };
  },

  /**
   * Retorna o relatório geral.
   */
  getGeneralReport() {
    return {
      ...this.buildReport(
        this.getSessions()
      )
    };
  },

  /**
   * Agrupa todas as sessões por dia.
   *
   * Útil quando houver mais de um torneio
   * cadastrado na mesma data.
   */
  getDailyResults(
    month = null,
    year = null
  ) {
    const sessions =
      month !== null &&
      year !== null
        ? this.getSessionsByMonth(
            month,
            year
          )
        : this.getSessions();

    const groupedResults = {};

    sessions.forEach(session => {
      if (!groupedResults[session.data]) {
        groupedResults[session.data] = {
          data: session.data,
          buyIns: 0,
          retornos: 0,
          resultado: 0,
          quantidadeSessoes: 0
        };
      }

      groupedResults[session.data].buyIns +=
        Number(session.buyIn) || 0;

      groupedResults[session.data].retornos +=
        Number(session.retorno) || 0;

      groupedResults[session.data].resultado +=
        Number(session.resultado) || 0;

      groupedResults[session.data]
        .quantidadeSessoes += 1;
    });

    return Object.values(groupedResults).sort(
      (firstDay, secondDay) =>
        firstDay.data.localeCompare(
          secondDay.data
        )
    );
  },

  /**
   * Retorna a evolução acumulada diária.
   *
   * Exemplo:
   * Dia 1: -100
   * Dia 2: +200
   *
   * Acumulado:
   * Dia 1: -100
   * Dia 2: +100
   */
  getAccumulatedEvolution(
    month = null,
    year = null
  ) {
    const dailyResults =
      this.getDailyResults(
        month,
        year
      );

    let accumulatedResult = 0;

    return dailyResults.map(day => {
      accumulatedResult += day.resultado;

      return {
        ...day,
        resultadoAcumulado:
          accumulatedResult
      };
    });
  },

  /**
   * Agrupa os resultados por mês.
   */
  getMonthlyEvolution() {
    const sessions = this.getSessions();

    const groupedMonths = {};

    sessions.forEach(session => {
      const monthKey =
        String(session.data).slice(0, 7);

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
          buyIns: 0,
          retornos: 0,
          resultado: 0,
          quantidadeSessoes: 0
        };
      }

      groupedMonths[monthKey].buyIns +=
        Number(session.buyIn) || 0;

      groupedMonths[monthKey].retornos +=
        Number(session.retorno) || 0;

      groupedMonths[monthKey].resultado +=
        Number(session.resultado) || 0;

      groupedMonths[monthKey]
        .quantidadeSessoes += 1;
    });

    let accumulatedResult = 0;

    return Object.values(groupedMonths)
      .sort(
        (firstMonth, secondMonth) =>
          firstMonth.periodo.localeCompare(
            secondMonth.periodo
          )
      )
      .map(month => {
        accumulatedResult += month.resultado;

        return {
          ...month,

          roi: this.calculateROI(
            month.resultado,
            month.buyIns
          ),

          resultadoAcumulado:
            accumulatedResult
        };
      });
  },

  /**
   * Define a banca inicial.
   *
   * Ela não altera o lucro ou prejuízo.
   * Serve apenas para calcular a banca atual.
   */
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

    const pokerData = this.getData();

    pokerData.bancaInicial = bankroll;

    this.saveData(pokerData);

    return bankroll;
  },

  /**
   * Retorna a banca atual.
   *
   * Banca atual:
   * banca inicial + resultado acumulado.
   */
  getCurrentBankroll() {
    const pokerData = this.getData();

    return (
      pokerData.bancaInicial +
      this.getTotalResult()
    );
  },

  /**
   * Retorna os últimos registros.
   */
  getRecentSessions(limit = 5) {
    const normalizedLimit = Math.max(
      1,
      Number(limit) || 5
    );

    return this.getSessions().slice(
      0,
      normalizedLimit
    );
  },

  /**
   * Retorna os dados consolidados para
   * Dashboard e gráficos.
   */
  getDashboardData(
    month = new Date().getMonth(),
    year = new Date().getFullYear()
  ) {
    return {
      bancaInicial:
        this.getData().bancaInicial,

      bancaAtual:
        this.getCurrentBankroll(),

      relatorioMensal:
        this.getMonthlyReport(
          month,
          year
        ),

      relatorioGeral:
        this.getGeneralReport(),

      resultadosDiarios:
        this.getDailyResults(
          month,
          year
        ),

      evolucaoMensal:
        this.getMonthlyEvolution(),

      evolucaoAcumulada:
        this.getAccumulatedEvolution(),

      ultimasSessoes:
        this.getRecentSessions(5)
    };
  },

  /**
   * Inicializa e normaliza o módulo.
   */
  initialize() {
    Storage.initialize();

    const pokerData = this.getData();

    this.saveData(pokerData);

    return {
      bancaInicial:
        pokerData.bancaInicial,

      quantidadeSessoes:
        pokerData.sessoes.length,

      relatorioGeral:
        this.getGeneralReport()
    };
  }
};

window.Poker = Poker;