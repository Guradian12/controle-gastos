/**
 * Funções auxiliares utilizadas em todo o aplicativo.
 */

const Utils = {
  /**
   * Formata um número como moeda brasileira.
   *
   * Exemplo:
   * 1500.5 → R$ 1.500,50
   */
  formatCurrency(value) {
    const number = Number(value) || 0;

    return number.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  },

  /**
   * Converte valores digitados para número.
   *
   * Aceita:
   * 1500
   * 1500.50
   * 1.500,50
   * R$ 1.500,50
   */
  parseCurrency(value) {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : 0;
    }

    if (!value) {
      return 0;
    }

    let normalizedValue = String(value)
      .trim()
      .replace(/\s/g, "")
      .replace("R$", "");

    const hasComma = normalizedValue.includes(",");
    const hasDot = normalizedValue.includes(".");

    if (hasComma && hasDot) {
      normalizedValue = normalizedValue
        .replace(/\./g, "")
        .replace(",", ".");
    } else if (hasComma) {
      normalizedValue = normalizedValue.replace(",", ".");
    }

    const number = Number(normalizedValue);

    return Number.isFinite(number) ? number : 0;
  },

  /**
   * Retorna a data atual no formato aceito pelo input date.
   *
   * Exemplo:
   * 2026-07-30
   */
  getToday() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  },

  /**
   * Formata uma data para o padrão brasileiro.
   *
   * Exemplo:
   * 2026-07-30 → 30/07/2026
   */
  formatDate(dateValue) {
    if (!dateValue) {
      return "";
    }

    const date = new Date(`${dateValue}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleDateString("pt-BR");
  },

  /**
   * Formata uma data com mês por extenso.
   *
   * Exemplo:
   * 30 de julho de 2026
   */
  formatLongDate(dateValue) {
    if (!dateValue) {
      return "";
    }

    const date = new Date(`${dateValue}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  },

  /**
   * Gera um identificador único para novos registros.
   */
  generateId(prefix = "item") {
    const randomPart = Math.random()
      .toString(36)
      .slice(2, 9);

    return `${prefix}-${Date.now()}-${randomPart}`;
  },

  /**
   * Retorna o primeiro e o último dia do mês.
   */
  getMonthRange(year, month) {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    return {
      start: this.dateToInputValue(startDate),
      end: this.dateToInputValue(endDate)
    };
  },

  /**
   * Converte um objeto Date para YYYY-MM-DD.
   */
  dateToInputValue(date) {
    if (!(date instanceof Date)) {
      return "";
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  },

  /**
   * Retorna o mês de uma data.
   *
   * Janeiro = 0
   * Dezembro = 11
   */
  getMonthFromDate(dateValue) {
    if (!dateValue) {
      return null;
    }

    const date = new Date(`${dateValue}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.getMonth();
  },

  /**
   * Retorna o ano de uma data.
   */
  getYearFromDate(dateValue) {
    if (!dateValue) {
      return null;
    }

    const date = new Date(`${dateValue}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.getFullYear();
  },

  /**
   * Verifica se uma data está dentro de determinado mês e ano.
   */
  isDateInMonth(dateValue, month, year) {
    return (
      this.getMonthFromDate(dateValue) === Number(month) &&
      this.getYearFromDate(dateValue) === Number(year)
    );
  },

  /**
   * Soma uma propriedade numérica de uma lista.
   *
   * Exemplo:
   * Utils.sumBy(gastos, "valor")
   */
  sumBy(items, property) {
    if (!Array.isArray(items)) {
      return 0;
    }

    return items.reduce((total, item) => {
      return total + (Number(item[property]) || 0);
    }, 0);
  },

  /**
   * Limita um número entre um valor mínimo e máximo.
   */
  clamp(value, min, max) {
    const number = Number(value) || 0;

    return Math.min(Math.max(number, min), max);
  },

  /**
   * Calcula uma porcentagem com segurança.
   */
  calculatePercentage(currentValue, totalValue) {
    const current = Number(currentValue) || 0;
    const total = Number(totalValue) || 0;

    if (total <= 0) {
      return 0;
    }

    return (current / total) * 100;
  },

  /**
   * Ordena registros pela data mais recente.
   */
  sortByNewest(items) {
    if (!Array.isArray(items)) {
      return [];
    }

    return [...items].sort((itemA, itemB) => {
      const dateA = new Date(
        `${itemA.data || "1970-01-01"}T00:00:00`
      );

      const dateB = new Date(
        `${itemB.data || "1970-01-01"}T00:00:00`
      );

      if (dateB.getTime() !== dateA.getTime()) {
        return dateB - dateA;
      }

      return Number(itemB.createdAt || 0) -
        Number(itemA.createdAt || 0);
    });
  },

  /**
   * Escapa textos inseridos pelo usuário.
   *
   * Isso evita que um texto digitado seja interpretado como HTML.
   */
  escapeHTML(value) {
    const text = String(value ?? "");

    const characters = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };

    return text.replace(/[&<>"']/g, character => {
      return characters[character];
    });
  },

  /**
   * Retorna uma cópia independente de um objeto.
   */
  clone(value) {
    return JSON.parse(JSON.stringify(value));
  },

  /**
   * Mostra uma confirmação antes de uma ação importante.
   */
  confirmAction(message) {
    return window.confirm(message);
  },

  /**
   * Exibe uma mensagem simples.
   *
   * Depois poderemos substituir por notificações visuais.
   */
  showMessage(message) {
    window.alert(message);
  }
};

window.Utils = Utils;