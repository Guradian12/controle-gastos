
const Miwra = {
    // ==========================================
    // CONFIGURAÇÕES E ARMAZENAMENTO
    // ==========================================

    getData() {
        const data = Storage.getMiwra() || {};

        return {
            comissoes: Array.isArray(data.comissoes)
                ? data.comissoes
                : [],
            custos: Array.isArray(data.custos)
                ? data.custos
                : []
        };
    },

    saveData(data) {
        Storage.updateSection("miwra", data);
    },

    generateId() {
        if (typeof crypto !== "undefined" && crypto.randomUUID) {
            return crypto.randomUUID();
        }

        return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    },

    toNumber(value) {
        if (typeof value === "number") {
            return Number.isFinite(value) ? value : 0;
        }

        if (typeof value !== "string") return 0;

        const normalized = value.trim().replace(",", ".");
        const number = Number(normalized);

        return Number.isFinite(number) ? number : 0;
    },

    isValidDate(date) {
        if (typeof date !== "string") return false;

        const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);

        if (!match) return false;

        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);

        const parsed = new Date(year, month - 1, day);

        return (
            parsed.getFullYear() === year &&
            parsed.getMonth() === month - 1 &&
            parsed.getDate() === day
        );
    },

    // ==========================================
    // VALIDAÇÃO DE COMISSÕES
    // ==========================================

    validateCommission(data) {
        const errors = [];

        if (!data || typeof data !== "object") {
            return {
                valid: false,
                errors: ["Dados da comissão inválidos."]
            };
        }

        if (this.toNumber(data.valor) <= 0) {
            errors.push("O valor da comissão deve ser maior que zero.");
        }

        if (!this.isValidDate(data.data)) {
            errors.push("Informe uma data válida.");
        }

        if (!["pendente", "recebida"].includes(data.status)) {
            errors.push("Informe um status válido.");
        }

        return {
            valid: errors.length === 0,
            errors
        };
    },

    normalizeCommission(data) {
        return {
            id: data.id || this.generateId(),
            valor: this.toNumber(data.valor),
            data: data.data,
            status: data.status,
            descricao: String(data.descricao || "").trim(),
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    },

    // ==========================================
    // CADASTRO DE COMISSÕES
    // ==========================================

    createCommission(data) {
        const validation = this.validateCommission(data);

        if (!validation.valid) {
            return {
                success: false,
                errors: validation.errors
            };
        }

        const database = this.getData();
        const commission = this.normalizeCommission(data);

        database.comissoes.push(commission);
        this.saveData(database);

        return {
            success: true,
            data: commission
        };
    },

    getCommission(id) {
        return this.getData().comissoes.find(
            commission => commission.id === id
        ) || null;
    },

    updateCommission(id, data) {
        const database = this.getData();

        const index = database.comissoes.findIndex(
            commission => commission.id === id
        );

        if (index === -1) {
            return {
                success: false,
                errors: ["Comissão não encontrada."]
            };
        }

        const validation = this.validateCommission(data);

        if (!validation.valid) {
            return {
                success: false,
                errors: validation.errors
            };
        }

        const updatedCommission = this.normalizeCommission({
            ...database.comissoes[index],
            ...data,
            id,
            createdAt: database.comissoes[index].createdAt
        });

        database.comissoes[index] = updatedCommission;
        this.saveData(database);

        return {
            success: true,
            data: updatedCommission
        };
    },

    deleteCommission(id) {
        const database = this.getData();
        const initialLength = database.comissoes.length;

        database.comissoes = database.comissoes.filter(
            commission => commission.id !== id
        );

        if (database.comissoes.length === initialLength) {
            return false;
        }

        this.saveData(database);
        return true;
    },

    // ==========================================
    // VALIDAÇÃO DE CUSTOS OPERACIONAIS
    // ==========================================

    validateCost(data) {
        const errors = [];

        if (!data || typeof data !== "object") {
            return {
                valid: false,
                errors: ["Dados do custo inválidos."]
            };
        }

        if (!data.nome || !String(data.nome).trim()) {
            errors.push("Informe o nome do custo.");
        }

        if (this.toNumber(data.valor) <= 0) {
            errors.push("O valor deve ser maior que zero.");
        }

        if (!this.isValidDate(data.data)) {
            errors.push("Informe uma data válida.");
        }

        return {
            valid: errors.length === 0,
            errors
        };
    },

    normalizeCost(data) {
        return {
            id: data.id || this.generateId(),
            nome: String(data.nome).trim(),
            valor: this.toNumber(data.valor),
            data: data.data,
            categoria: String(data.categoria || "Ferramentas").trim(),
            descricao: String(data.descricao || "").trim(),
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    },

    // ==========================================
    // CADASTRO DE CUSTOS
    // ==========================================

    createCost(data) {
        const validation = this.validateCost(data);

        if (!validation.valid) {
            return {
                success: false,
                errors: validation.errors
            };
        }

        const database = this.getData();
        const cost = this.normalizeCost(data);

        database.custos.push(cost);
        this.saveData(database);

        return {
            success: true,
            data: cost
        };
    },

    getCost(id) {
        return this.getData().custos.find(
            cost => cost.id === id
        ) || null;
    },

    updateCost(id, data) {
        const database = this.getData();

        const index = database.custos.findIndex(
            cost => cost.id === id
        );

        if (index === -1) {
            return {
                success: false,
                errors: ["Custo não encontrado."]
            };
        }

        const validation = this.validateCost(data);

        if (!validation.valid) {
            return {
                success: false,
                errors: validation.errors
            };
        }

        const updatedCost = this.normalizeCost({
            ...database.custos[index],
            ...data,
            id,
            createdAt: database.custos[index].createdAt
        });

        database.custos[index] = updatedCost;
        this.saveData(database);

        return {
            success: true,
            data: updatedCost
        };
    },

    deleteCost(id) {
        const database = this.getData();
        const initialLength = database.custos.length;

        database.custos = database.custos.filter(
            cost => cost.id !== id
        );

        if (database.custos.length === initialLength) {
            return false;
        }

        this.saveData(database);
        return true;
    },

    // ==========================================
    // FILTROS
    // ==========================================

    filterCommissions(filters = {}) {
        let commissions = [...this.getData().comissoes];

        if (filters.startDate) {
            commissions = commissions.filter(
                commission => commission.data >= filters.startDate
            );
        }

        if (filters.endDate) {
            commissions = commissions.filter(
                commission => commission.data <= filters.endDate
            );
        }

        if (filters.month !== undefined && filters.year !== undefined) {
            commissions = commissions.filter(commission => {
                const [year, month] = commission.data.split("-").map(Number);

                return (
                    month === Number(filters.month) + 1 &&
                    year === Number(filters.year)
                );
            });
        }

        if (filters.status) {
            commissions = commissions.filter(
                commission => commission.status === filters.status
            );
        }

        return commissions.sort(
            (a, b) => b.data.localeCompare(a.data)
        );
    },

    filterCosts(filters = {}) {
        let costs = [...this.getData().custos];

        if (filters.startDate) {
            costs = costs.filter(
                cost => cost.data >= filters.startDate
            );
        }

        if (filters.endDate) {
            costs = costs.filter(
                cost => cost.data <= filters.endDate
            );
        }

        if (filters.month !== undefined && filters.year !== undefined) {
            costs = costs.filter(cost => {
                const [year, month] = cost.data.split("-").map(Number);

                return (
                    month === Number(filters.month) + 1 &&
                    year === Number(filters.year)
                );
            });
        }

        if (filters.category) {
            costs = costs.filter(
                cost => cost.categoria === filters.category
            );
        }

        return costs.sort(
            (a, b) => b.data.localeCompare(a.data)
        );
    },

    // ==========================================
    // RELATÓRIOS E TOTAIS
    // ==========================================

    calculateTotals(filters = {}) {
        const commissions = this.filterCommissions(filters);
        const costs = this.filterCosts(filters);

        const comissoesRecebidas = commissions
            .filter(commission => commission.status === "recebida")
            .reduce(
                (total, commission) => total + this.toNumber(commission.valor),
                0
            );

        const comissoesPendentes = commissions
            .filter(commission => commission.status === "pendente")
            .reduce(
                (total, commission) => total + this.toNumber(commission.valor),
                0
            );

        const custosFerramentas = costs
            .filter(cost => cost.categoria === "Ferramentas")
            .reduce(
                (total, cost) => total + this.toNumber(cost.valor),
                0
            );

        const custosOperacionais = costs.reduce(
            (total, cost) => total + this.toNumber(cost.valor),
            0
        );

        const lucroLiquido = comissoesRecebidas - custosOperacionais;

        return {
            quantidadeComissoes: commissions.length,
            quantidadeRecebidas: commissions.filter(
                commission => commission.status === "recebida"
            ).length,
            quantidadePendentes: commissions.filter(
                commission => commission.status === "pendente"
            ).length,

            comissoesRecebidas,
            comissoesPendentes,
            custosFerramentas,
            custosOperacionais,
            lucroLiquido
        };
    },

    // ==========================================
    // DASHBOARD
    // ==========================================

    getDashboardData(month, year) {
        const filters = {};

        if (month !== undefined && year !== undefined) {
            filters.month = month;
            filters.year = year;
        }

        const totals = this.calculateTotals(filters);

        return {
            ...totals,

            comissoesRecentes: this.filterCommissions(filters).slice(0, 5),

            custosRecentes: this.filterCosts(filters).slice(0, 5)
        };
    },

    // ==========================================
    // RELATÓRIO MENSAL
    // ==========================================

    getMonthlyReport(year) {
        const report = [];

        for (let month = 0; month < 12; month++) {
            const totals = this.calculateTotals({
                month,
                year
            });

            report.push({
                mes: month,
                ano: year,
                ...totals
            });
        }

        return report;
    },

    // ==========================================
    // HISTÓRICO GERAL
    // ==========================================

    getHistory() {
        const database = this.getData();

        const commissions = database.comissoes.map(commission => ({
            ...commission,
            tipo: "comissao",
            valor: commission.valor
        }));

        const costs = database.custos.map(cost => ({
            ...cost,
            tipo: "custo",
            valor: cost.valor
        }));

        return [...commissions, ...costs].sort(
            (a, b) => b.data.localeCompare(a.data)
        );
    },

    // ==========================================
    // INICIALIZAÇÃO
    // ==========================================

    initialize() {
        const database = this.getData();

        const normalized = {
            comissoes: database.comissoes.map(commission => ({
                ...commission,
                status: commission.status || "pendente",
                descricao: commission.descricao || ""
            })),

            custos: database.custos.map(cost => ({
                categoria: "Ferramentas",
                descricao: "",
                ...cost
            }))
        };

        this.saveData(normalized);

        return true;
    }
};

window.Miwra = Miwra;
