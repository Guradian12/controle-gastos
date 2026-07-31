/**
 * Interface da aplicação.
 *
 * Esta versão não cria o HTML.
 * Ela utiliza os elementos existentes no index.html.
 */

const UI = {
  currentPage: "dashboard",
  dashboardChart: null,

  /**
   * Formata valores monetários.
   */
  formatCurrency(value) {
    const number = Number(value) || 0;

    if (
      typeof Utils !== "undefined" &&
      typeof Utils.formatCurrency === "function"
    ) {
      return Utils.formatCurrency(number);
    }

    return number.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  },

  /**
   * Formata datas no padrão brasileiro.
   */
  formatDate(date) {
    if (!date) {
      return "";
    }

    const parts = String(date).split("-");

    if (parts.length !== 3) {
      return String(date);
    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  },

  /**
   * Protege textos inseridos no HTML.
   */
  escapeHTML(value) {
    const element =
      document.createElement("div");

    element.textContent =
      String(value ?? "");

    return element.innerHTML;
  },

  /**
   * Atualiza o texto de um elemento.
   */
  setText(id, value) {
    const element =
      document.getElementById(id);

    if (element) {
      element.textContent = value;
    }
  },

  /**
   * Atualiza um valor monetário e sua cor.
   */
  setCurrency(id, value) {
    const element =
      document.getElementById(id);

    if (!element) {
      return;
    }

    const number =
      Number(value) || 0;

    element.textContent =
      this.formatCurrency(number);

    element.classList.remove(
      "positive",
      "negative",
      "neutral"
    );

    if (number > 0) {
      element.classList.add(
        "positive"
      );
    } else if (number < 0) {
      element.classList.add(
        "negative"
      );
    } else {
      element.classList.add(
        "neutral"
      );
    }
  },

  /**
   * Retorna a data atual.
   */
  getToday() {
    if (
      typeof Utils !== "undefined" &&
      typeof Utils.getToday === "function"
    ) {
      return Utils.getToday();
    }

    return new Date()
      .toISOString()
      .split("T")[0];
  },

  /**
   * Preenche datas vazias com a data atual.
   */
  setDefaultDates() {
    [
      "dataReceita",
      "dataGasto",
      "dataPoker",
      "dataBet"
    ].forEach(id => {
      const input =
        document.getElementById(id);

      if (input && !input.value) {
        input.value =
          this.getToday();
      }
    });
  },

  /**
   * Troca a página exibida.
   */
  navigate(pageId) {
    const targetPage =
      document.getElementById(
        pageId
      );

    if (!targetPage) {
      console.warn(
        `Página não encontrada: ${pageId}`
      );

      return;
    }

    document
      .querySelectorAll(".page")
      .forEach(page => {
        page.classList.remove(
          "active"
        );
      });

    document
      .querySelectorAll(".menu-btn")
      .forEach(button => {
        button.classList.remove(
          "active"
        );
      });

    targetPage.classList.add(
      "active"
    );

    document
      .querySelector(
        `.menu-btn[data-page="${pageId}"]`
      )
      ?.classList.add("active");

    this.currentPage =
      pageId;

    this.refreshPage(pageId);
  },

  /**
   * Configura os eventos do menu.
   */
  bindNavigation() {
    document
      .querySelectorAll(".menu-btn")
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            this.navigate(
              button.dataset.page
            );
          }
        );
      });
  },

  /**
   * Retorna o ano selecionado.
   */
  getSelectedYear() {
    const select =
      document.getElementById(
        "filtroAnoDashboard"
      );

    return Number(
      select?.value ||
      new Date().getFullYear()
    );
  },

  /**
   * Atualiza o Dashboard.
   */
  renderDashboard() {
    try {
      const year =
        this.getSelectedYear();

      const month =
        new Date().getMonth();

      const data =
        Dashboard.getData(
          month,
          year
        );

      const summary =
        data.resumo || {};

      this.setCurrency(
        "saldoAtual",
        summary.saldoCombinado
      );

      this.setCurrency(
        "totalReceitas",
        summary.receitas
      );

      this.setCurrency(
        "totalGastos",
        summary.gastos
      );

      this.setCurrency(
        "economizado",
        summary.saldoPessoal
      );

      this.setCurrency(
        "resultadoPokerDashboard",
        summary.poker
      );

      this.setCurrency(
        "resultadoBetsDashboard",
        summary.bets
      );

      this.renderDashboardChart(
        data
      );

      this.renderExpenseDistribution(
        data
      );

      this.renderRecentTransactions(
        data.atividadesRecentes
      );
    } catch (error) {
      console.error(
        "Erro ao atualizar o Dashboard:",
        error
      );
    }
  },

  /**
   * Renderiza o gráfico principal.
   */
  renderDashboardChart(data) {
    const canvas =
      document.getElementById(
        "graficoMensal"
      );

    if (
      !canvas ||
      typeof Chart === "undefined"
    ) {
      return;
    }

    if (this.dashboardChart) {
      this.dashboardChart.destroy();
    }

    const summary =
      data.resumo || {};

    this.dashboardChart =
      new Chart(
        canvas.getContext("2d"),
        {
          type: "bar",

          data: {
            labels: [
              "Receitas",
              "Gastos",
              "Saldo pessoal",
              "Poker",
              "Bets"
            ],

            datasets: [
              {
                label:
                  "Resultado do mês",

                data: [
                  Number(
                    summary.receitas
                  ) || 0,

                  Number(
                    summary.gastos
                  ) || 0,

                  Number(
                    summary.saldoPessoal
                  ) || 0,

                  Number(
                    summary.poker
                  ) || 0,

                  Number(
                    summary.bets
                  ) || 0
                ],

                borderWidth: 1,
                borderRadius: 8
              }
            ]
          },

          options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
              legend: {
                display: false
              },

              tooltip: {
                callbacks: {
                  label: context =>
                    this.formatCurrency(
                      context.parsed.y
                    )
                }
              }
            },

            scales: {
              y: {
                beginAtZero: true,

                ticks: {
                  callback: value =>
                    this.formatCurrency(
                      value
                    )
                }
              }
            }
          }
        }
      );
  },

  /**
   * Atualiza o círculo de despesas.
   */
  renderExpenseDistribution(data) {
    const summary =
      data.resumo || {};

    const income =
      Number(
        summary.receitas
      ) || 0;

    const expenses =
      Number(
        summary.gastos
      ) || 0;

    const percentage =
      income > 0
        ? Math.min(
            (
              expenses /
              income
            ) * 100,
            100
          )
        : 0;

    const donut =
      document.getElementById(
        "donutDespesas"
      );

    if (donut) {
      donut.style.setProperty(
        "--percentage",
        percentage
      );
    }

    this.setText(
      "percentualDespesas",
      `${percentage.toFixed(0)}%`
    );

    this.renderExpenseLegend(
      data.graficos
        ?.gastosPorCategoria
    );
  },

  /**
   * Atualiza a legenda de gastos.
   */
  renderExpenseLegend(categories) {
    const container =
      document.getElementById(
        "legendaDespesas"
      );

    if (!container) {
      return;
    }

    const categoryList =
      Array.isArray(categories)
        ? categories
        : [];

    if (!categoryList.length) {
      container.innerHTML = `
        <p class="empty-message">
          Nenhuma despesa registrada.
        </p>
      `;

      return;
    }

    container.innerHTML =
      categoryList
        .slice(0, 5)
        .map(item => {
          const name =
            item.categoriaNome ??
            item.nome ??
            item.categoria ??
            "Sem categoria";

          const total =
            item.total ??
            item.valor ??
            item.gastos ??
            0;

          return `
            <div class="legend-item">
              <span class="legend-color"></span>

              <span>
                ${this.escapeHTML(name)}
              </span>

              <strong>
                ${this.formatCurrency(total)}
              </strong>
            </div>
          `;
        })
        .join("");
  },

  /**
   * Atualiza os últimos lançamentos.
   */
  renderRecentTransactions(activities) {
    const container =
      document.getElementById(
        "ultimosLancamentos"
      );

    if (!container) {
      return;
    }

    const list =
      Array.isArray(activities)
        ? activities
        : [];

    if (!list.length) {
      container.innerHTML = `
        <p class="empty-message">
          Nenhum lançamento registrado.
        </p>
      `;

      return;
    }

    container.innerHTML =
      list
        .slice(0, 8)
        .map(activity => `
          <div class="transaction-item">
            <div>
              <strong>
                ${this.escapeHTML(
                  activity.title ||
                  "Lançamento"
                )}
              </strong>

              <small>
                ${this.formatDate(
                  activity.date
                )}
              </small>
            </div>

            <strong class="${
              Number(
                activity.result
              ) >= 0
                ? "positive"
                : "negative"
            }">
              ${this.formatCurrency(
                activity.result
              )}
            </strong>
          </div>
        `)
        .join("");
  },

  /**
   * Procura um método disponível em um módulo.
   */
  callModuleMethod(
    module,
    methodNames,
    ...parameters
  ) {
    for (
      const methodName
      of methodNames
    ) {
      if (
        module &&
        typeof module[
          methodName
        ] === "function"
      ) {
        return module[
          methodName
        ](...parameters);
      }
    }

    throw new Error(
      `Nenhum método compatível encontrado: ${methodNames.join(
        ", "
      )}`
    );
  },

  /**
   * Formulário de receitas.
   */
  bindIncomeForm() {
    const form =
      document.getElementById(
        "formReceita"
      );

    if (!form) {
      return;
    }

    form.addEventListener(
      "submit",
      event => {
        event.preventDefault();

        try {
          const payload = {
            valor:
              Number(
                document.getElementById(
                  "valorReceita"
                ).value
              ),

            categoria:
              document.getElementById(
                "categoriaReceita"
              ).value,

            descricao:
              document.getElementById(
                "descricaoReceita"
              ).value.trim(),

            data:
              document.getElementById(
                "dataReceita"
              ).value
          };

          this.callModuleMethod(
            Expenses,
            [
              "createIncome",
              "createRevenue",
              "addIncome",
              "addRevenue",
              "createReceita"
            ],
            payload
          );

          form.reset();

          this.setDefaultDates();

          this.showMessage(
            "Receita salva com sucesso."
          );

          this.refreshAll();
        } catch (error) {
          console.error(error);

          this.showMessage(
            error.message ||
            "Não foi possível salvar a receita.",
            "error"
          );
        }
      }
    );
  },

  /**
   * Formulário de gastos.
   */
  bindExpenseForm() {
    const form =
      document.getElementById(
        "formGasto"
      );

    if (!form) {
      return;
    }

    form.addEventListener(
      "submit",
      event => {
        event.preventDefault();

        try {
          const payload = {
            valor:
              Number(
                document.getElementById(
                  "valorGasto"
                ).value
              ),

            categoria:
              document.getElementById(
                "categoriaGasto"
              ).value,

            descricao:
              document.getElementById(
                "descricaoGasto"
              ).value.trim(),

            data:
              document.getElementById(
                "dataGasto"
              ).value
          };

          this.callModuleMethod(
            Expenses,
            [
              "createExpense",
              "addExpense",
              "createGasto"
            ],
            payload
          );

          form.reset();

          this.setDefaultDates();

          this.showMessage(
            "Gasto salvo com sucesso."
          );

          this.refreshAll();
        } catch (error) {
          console.error(error);

          this.showMessage(
            error.message ||
            "Não foi possível salvar o gasto.",
            "error"
          );
        }
      }
    );
  },

/**
 * Formulário de Limites.
 */
bindLimitsForm() {
  const form =
    document.getElementById(
      "formLimites"
    );

  if (!form) {
    return;
  }

  form.addEventListener(
    "submit",
    event => {
      event.preventDefault();

      try {
        const getValue = id => {
          const input =
            document.getElementById(id);

          const value =
            Number(input?.value || 0);

          if (
            !Number.isFinite(value) ||
            value < 0
          ) {
            throw new Error(
              "Os limites devem ser números maiores ou iguais a zero."
            );
          }

          return value;
        };

        const limits =
          Storage.getLimites() || {};

        const goals =
          Storage.getMetas() || {};

        limits.mensalGeral =
          getValue("limiteMensal");

        limits.poker =
          getValue("limitePoker");

        limits.bets =
          getValue("limiteBets");

        goals.economiaMensal =
          getValue("metaEconomia");

        Storage.updateSection(
          "limites",
          limits
        );

        Storage.updateSection(
          "metas",
          goals
        );

        Categories.setCategoryLimit(
          "alimentacao",
          getValue(
            "limiteAlimentacao"
          )
        );

        Categories.setCategoryLimit(
          "transporte",
          getValue(
            "limiteTransporte"
          )
        );

        Categories.setCategoryLimit(
          "lazer",
          getValue(
            "limiteLazer"
          )
        );

        this.showMessage(
          "Limites salvos com sucesso."
        );

        this.renderLimitsPage();
      } catch (error) {
        console.error(error);

        this.showMessage(
          error.message ||
          "Não foi possível salvar os limites.",
          "error"
        );
      }
    }
  );
},

/**
 * Atualiza os campos da página de Limites.
 */
renderLimitsPage() {
  try {
    const limits =
      Storage.getLimites() || {};

    const goals =
      Storage.getMetas() || {};

    const setInputValue = (
      id,
      value
    ) => {
      const input =
        document.getElementById(id);

      if (input) {
        input.value =
          Number(value) || 0;
      }
    };

    setInputValue(
      "limiteMensal",
      limits.mensalGeral
    );

    setInputValue(
      "metaEconomia",
      goals.economiaMensal
    );

    setInputValue(
      "limiteAlimentacao",
      Categories.getCategoryLimit(
        "alimentacao"
      )
    );

    setInputValue(
      "limiteTransporte",
      Categories.getCategoryLimit(
        "transporte"
      )
    );

    setInputValue(
      "limiteLazer",
      Categories.getCategoryLimit(
        "lazer"
      )
    );

    setInputValue(
      "limitePoker",
      limits.poker
    );

    setInputValue(
      "limiteBets",
      limits.bets
    );

    this.setCurrency(
      "totalLimiteAlimentacao",
      Categories.getCategoryLimit(
        "alimentacao"
      )
    );

    this.setCurrency(
      "totalLimiteTransporte",
      Categories.getCategoryLimit(
        "transporte"
      )
    );

    this.setCurrency(
      "totalLimiteLazer",
      Categories.getCategoryLimit(
        "lazer"
      )
    );

    this.setCurrency(
      "totalLimitePoker",
      limits.poker
    );

    this.setCurrency(
      "totalLimiteBets",
      limits.bets
    );
  } catch (error) {
    console.error(
      "Erro ao atualizar Limites:",
      error
    );
  }
},

  /**
   * Formulário de Poker.
   */
  bindPokerForm() {
    const form =
      document.getElementById(
        "formPoker"
      );

    if (!form) {
      return;
    }

    form.addEventListener(
      "submit",
      event => {
        event.preventDefault();

        try {
          const buyIn =
            Number(
              document.getElementById(
                "buyinPoker"
              ).value
            ) || 0;

          const reentry =
            Number(
              document.getElementById(
                "reentradaPoker"
              ).value
            ) || 0;

          const returnValue =
            Number(
              document.getElementById(
                "retornoPoker"
              ).value
            ) || 0;

          Poker.createSession({
            data:
              document.getElementById(
                "dataPoker"
              ).value,

            buyIn:
              buyIn +
              reentry,

            retorno:
              returnValue,

            descricao:
              document.getElementById(
                "modalidadePoker"
              ).value,

            local:
              document.getElementById(
                "localPoker"
              ).value.trim(),

            observacao:
              document.getElementById(
                "observacaoPoker"
              ).value.trim()
          });

          form.reset();

          this.setDefaultDates();

          this.showMessage(
            "Sessão de Poker salva."
          );

          this.refreshAll();
        } catch (error) {
          console.error(error);

          this.showMessage(
            error.message ||
            "Não foi possível salvar a sessão.",
            "error"
          );
        }
      }
    );
  },

  /**
   * Formulário simplificado de Bets.
   */
  bindBetForm() {
    const form =
      document.getElementById(
        "formBet"
      );

    if (!form) {
      return;
    }

    const statusSelect =
      document.getElementById(
        "statusBet"
      );

    const returnInput =
      document.getElementById(
        "retornoBet"
      );

    const returnGroup =
      document.getElementById(
        "retornoBetGroup"
      );

    if (
      !statusSelect ||
      !returnInput
    ) {
      console.warn(
        "Campos do formulário de Bets não encontrados."
      );

      return;
    }

    const updateReturnField = () => {
      const status =
        statusSelect.value;

      const shouldShow =
        status === "Ganha" ||
        status === "Cash Out";

      if (returnGroup) {
        returnGroup.hidden =
          !shouldShow;
      }

      returnInput.required =
        shouldShow;

      if (!shouldShow) {
        returnInput.value = "";
      }
    };

    statusSelect.addEventListener(
      "change",
      updateReturnField
    );

    updateReturnField();

    form.addEventListener(
      "submit",
      event => {
        event.preventDefault();

        try {
          const date =
            document.getElementById(
              "dataBet"
            ).value;

          const description =
            document.getElementById(
              "eventoBet"
            ).value.trim();

          const investment =
            Number(
              document.getElementById(
                "valorBet"
              ).value
            );

          const status =
            statusSelect.value;

          if (
            !Number.isFinite(
              investment
            ) ||
            investment <= 0
          ) {
            throw new Error(
              "Informe um valor apostado válido."
            );
          }

          let returnValue = 0;

          if (
            status === "Ganha" ||
            status === "Cash Out"
          ) {
            returnValue =
              Number(
                returnInput.value
              );

            if (
              !Number.isFinite(
                returnValue
              ) ||
              returnValue < 0
            ) {
              throw new Error(
                "Informe um retorno válido."
              );
            }
          }

          if (
            status === "Perdida"
          ) {
            returnValue = 0;
          }

          if (
            status === "Anulada"
          ) {
            returnValue =
              investment;
          }

          Bets.createBet({
            data: date,
            categoria: "pessoal",
            investimento:
              investment,
            retorno:
              returnValue,
            descricao:
              description,
            observacao:
              status
          });

          form.reset();

          this.setDefaultDates();
          updateReturnField();

          this.showMessage(
            "Aposta salva com sucesso."
          );

          this.refreshAll();
        } catch (error) {
          console.error(error);

          this.showMessage(
            error.message ||
            "Não foi possível salvar a aposta.",
            "error"
          );
        }
      }
    );
  },

  /**
   * Atualiza a página Poker.
   */
  renderPokerPage() {
    try {
      const data =
        Poker.getDashboardData();

      const general =
        data.relatorioGeral || {};

      this.setCurrency(
        "bancaPoker",
        data.bancaAtual
      );

      this.setCurrency(
        "totalInvestidoPoker",
        general.totalBuyIns
      );

      this.setCurrency(
        "resultadoPoker",
        general.resultado
      );

      this.renderPokerList(
        data.ultimasSessoes
      );
    } catch (error) {
      console.error(
        "Erro na página Poker:",
        error
      );
    }
  },

  /**
 * Renderiza a lista de sessões de Poker.
 */
renderPokerList(sessions) {
  const container =
    document.getElementById(
      "listaPoker"
    );

  if (!container) {
    return;
  }

  const list =
    Array.isArray(sessions)
      ? sessions
      : [];

  if (!list.length) {
    container.innerHTML = `
      <p class="empty-message">
        Nenhuma sessão registrada.
      </p>
    `;

    return;
  }

  container.innerHTML =
    list
      .map(session => `
        <div class="list-item">
          <div class="list-item-content">
            <strong>
              ${this.escapeHTML(
                session.descricao ||
                "Sessão de Poker"
              )}
            </strong>

            <small>
              ${this.formatDate(
                session.data
              )}

              ${
                session.local
                  ? ` • ${this.escapeHTML(
                      session.local
                    )}`
                  : ""
              }
            </small>
          </div>

          <div class="list-item-actions">
            <strong class="${
              Number(
                session.resultado
              ) >= 0
                ? "positive"
                : "negative"
            }">
              ${this.formatCurrency(
                session.resultado
              )}
            </strong>

            <button
              type="button"
              class="btn-delete-poker"
              data-session-id="${this.escapeHTML(
                session.id
              )}"
            >
              Excluir
            </button>
          </div>
        </div>
      `)
      .join("");

  container
    .querySelectorAll(
      ".btn-delete-poker"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          const sessionId =
            button.dataset.sessionId;

          const confirmed =
            window.confirm(
              "Deseja realmente excluir esta sessão de Poker?"
            );

          if (!confirmed) {
            return;
          }

          try {
            const result =
              Poker.deleteSession(
                sessionId
              );

            if (!result.success) {
              throw new Error(
                result.error ||
                "Sessão de Poker não encontrada."
              );
            }

            this.showMessage(
              "Sessão de Poker excluída com sucesso."
            );

            this.refreshAll();
          } catch (error) {
            console.error(error);

            this.showMessage(
              error.message ||
              "Não foi possível excluir a sessão.",
              "error"
            );
          }
        }
      );
    });
},

  /**
   * Atualiza a página Bets.
   */
  renderBetsPage() {
    try {
      const data =
        Bets.getDashboardData();

      const general =
        data.geral?.total || {};

      this.setCurrency(
        "bancaBets",
        data.bancaAtual
      );

      this.setCurrency(
        "totalApostado",
        general.investimento ??
        0
      );

      this.setCurrency(
        "resultadoBets",
        general.resultado
      );

      this.renderBetsList(
        data.ultimosRegistros
      );
    } catch (error) {
      console.error(
        "Erro na página Bets:",
        error
      );
    }
  },

  /**
 * Renderiza a lista de apostas.
 */
renderBetsList(bets) {
  const container =
    document.getElementById(
      "listaBets"
    );

  if (!container) {
    return;
  }

  const list =
    Array.isArray(bets)
      ? bets
      : [];

  if (!list.length) {
    container.innerHTML = `
      <p class="empty-message">
        Nenhuma aposta registrada.
      </p>
    `;

    return;
  }

  container.innerHTML =
    list
      .map(bet => `
        <div class="list-item">
          <div class="list-item-content">
            <strong>
              ${this.escapeHTML(
                bet.descricao ||
                "Aposta"
              )}
            </strong>

            <small>
              ${this.formatDate(
                bet.data
              )}

              ${
                bet.observacao
                  ? ` • ${this.escapeHTML(
                      bet.observacao
                    )}`
                  : ""
              }
            </small>
          </div>

          <div class="list-item-actions">
            <strong class="${
              Number(
                bet.resultado
              ) >= 0
                ? "positive"
                : "negative"
            }">
              ${this.formatCurrency(
                bet.resultado
              )}
            </strong>

            <button
              type="button"
              class="btn-delete-bet"
              data-bet-id="${this.escapeHTML(
                bet.id
              )}"
            >
              Excluir
            </button>
          </div>
        </div>
      `)
      .join("");

  container
    .querySelectorAll(
      ".btn-delete-bet"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          const betId =
            button.dataset.betId;

          const confirmed =
            window.confirm(
              "Deseja realmente excluir esta aposta?"
            );

          if (!confirmed) {
            return;
          }

          try {
            const result =
              Bets.deleteBet(
                betId
              );

            if (!result.success) {
              throw new Error(
                result.error ||
                "Aposta não encontrada."
              );
            }

            this.showMessage(
              "Aposta excluída com sucesso."
            );

            this.refreshAll();
          } catch (error) {
            console.error(error);

            this.showMessage(
              error.message ||
              "Não foi possível excluir a aposta.",
              "error"
            );
          }
        }
      );
    });
},

  /**
   * Configura o filtro do Dashboard.
   */
  bindDashboardFilter() {
    document
      .getElementById(
        "filtroAnoDashboard"
      )
      ?.addEventListener(
        "change",
        () => {
          this.renderDashboard();
        }
      );
  },

  /**
   * Configura exportação e limpeza de dados.
   */
  bindSettings() {
    document
      .getElementById(
        "exportar"
      )
      ?.addEventListener(
        "click",
        () => {
          try {
            const database =
              Storage.exportDatabase();

            const content =
              typeof database ===
              "string"
                ? database
                : JSON.stringify(
                    database,
                    null,
                    2
                  );

            const blob =
              new Blob(
                [content],
                {
                  type:
                    "application/json"
                }
              );

            const url =
              URL.createObjectURL(
                blob
              );

            const link =
              document.createElement(
                "a"
              );

            link.href = url;

            link.download =
              `controle-financeiro-${this.getToday()}.json`;

            document.body.appendChild(
              link
            );

            link.click();
            link.remove();

            URL.revokeObjectURL(
              url
            );

            this.showMessage(
              "Backup exportado."
            );
          } catch (error) {
            console.error(error);

            this.showMessage(
              "Não foi possível exportar.",
              "error"
            );
          }
        }
      );

    document
      .getElementById(
        "limpar"
      )
      ?.addEventListener(
        "click",
        () => {
          const confirmed =
            window.confirm(
              "Deseja apagar todos os dados? Esta ação não poderá ser desfeita."
            );

          if (!confirmed) {
            return;
          }

          try {
            Storage.resetDatabase();
            Storage.initialize();

            this.refreshAll();

            this.navigate(
              "dashboard"
            );

            this.showMessage(
              "Dados apagados."
            );
          } catch (error) {
            console.error(error);

            this.showMessage(
              "Não foi possível apagar os dados.",
              "error"
            );
          }
        }
      );

    document
      .getElementById(
        "importar"
      )
      ?.addEventListener(
        "click",
        () => {
          this.showMessage(
            "A importação será adicionada posteriormente.",
            "info"
          );
        }
      );
  },

  /**
   * Exibe uma mensagem temporária.
   */
  showMessage(
    message,
    type = "success"
  ) {
    let container =
      document.getElementById(
        "ui-message-container"
      );

    if (!container) {
      container =
        document.createElement(
          "div"
        );

      container.id =
        "ui-message-container";

      container.style.position =
        "fixed";

      container.style.right =
        "20px";

      container.style.bottom =
        "20px";

      container.style.zIndex =
        "9999";

      document.body.appendChild(
        container
      );
    }

    const messageElement =
      document.createElement(
        "div"
      );

    messageElement.className =
      `ui-message ui-message-${type}`;

    messageElement.textContent =
      message;

    messageElement.style.padding =
      "14px 18px";

    messageElement.style.marginTop =
      "10px";

    messageElement.style.borderRadius =
      "10px";

    messageElement.style.background =
      type === "error"
        ? "#dc2626"
        : type === "info"
          ? "#2563eb"
          : "#16a34a";

    messageElement.style.color =
      "#ffffff";

    messageElement.style.boxShadow =
      "0 8px 24px rgba(0, 0, 0, 0.15)";

    container.appendChild(
      messageElement
    );

    setTimeout(() => {
      messageElement.remove();
    }, 3000);
  },

  /**
   * Atualiza a página selecionada.
   */
  refreshPage(pageId) {
    switch (pageId) {
      case "dashboard":
        this.renderDashboard();
        break;

      case "limites":
        this.renderLimitsPage();
        break;
      
      case "poker":
        this.renderPokerPage();
        break;

      case "bets":
        this.renderBetsPage();
        break;

      default:
        break;
    }
  },

  /**
   * Atualiza os principais dados.
   */
  refreshAll() {
    this.renderDashboard();
    this.renderLimitsPage();
    this.renderPokerPage();
    this.renderBetsPage();
  },

  /**
   * Inicializa a interface.
   */
  initialize() {
    this.bindNavigation();
    this.bindDashboardFilter();

    this.bindIncomeForm();
    this.bindExpenseForm();
    this.bindLimitsForm();
    this.bindPokerForm();
    this.bindBetForm();

    this.bindSettings();
    this.setDefaultDates();

    this.navigate(
      "dashboard"
    );

    return {
      success: true,
      currentPage:
        this.currentPage
    };
  }
};

window.UI = UI;