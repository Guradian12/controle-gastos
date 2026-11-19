
const ML = {
    // ==========================================
    // CONFIGURAÇÕES E ARMAZENAMENTO
    // ==========================================

    getData() {
        const data = Storage.getML() || {};

        return {
            vendas: Array.isArray(data.vendas) ? data.vendas : [],
            custos: Array.isArray(data.custos) ? data.custos : []
        };
    },

    saveData(data) {
        Storage.updateSection("ml", data);
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
    // VALIDAÇÃO DE VENDAS
    // ==========================================

    validateSale(data) {
        const errors = [];

        if (!data || typeof data !== "object") {
            return {
                valid: false,
                errors: ["Dados da venda inválidos."]
            };
        }

        if (!data.produto || !String(data.produto).trim()) {
            errors.push("Informe o nome do produto.");
        }

        if (!this.isValidDate(data.data)) {
            errors.push("Informe uma data válida.");
        }

        const precoCompra = this.toNumber(data.precoCompra);
        const precoVenda = this.toNumber(data.precoVenda);
        const taxas = this.toNumber(data.taxas);
        const outrosCustos = this.toNumber(data.outrosCustos);

        if (precoCompra <= 0) {
            errors.push("O preço de compra deve ser maior que zero.");
        }

        if (precoVenda <= 0) {
            errors.push("O preço de venda deve ser maior que zero.");
        }

        if (taxas < 0) {
            errors.push("As taxas não podem ser negativas.");
        }

        if (outrosCustos < 0) {
            errors.push("Os outros custos não podem ser negativos.");
        }

        return {
            valid: errors.length === 0,
            errors
        };
    },

    normalizeSale(data) {
        const sale = {
            id: data.id || this.generateId(),
            produto: String(data.produto).trim(),
            precoCompra: this.toNumber(data.precoCompra),
            precoVenda: this.toNumber(data.precoVenda),
            taxas: this.toNumber(data.taxas),
            outrosCustos: this.toNumber(data.outrosCustos),
            data: data.data,
            descricao: String(data.descricao || "").trim(),
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        sale.lucro = this.calculateSaleProfit(sale);

        return sale;
    },

    // ==========================================
    // CÁLCULOS DE VENDAS
    // ==========================================

    calculateSaleProfit(sale) {
        return (
            this.toNumber(sale.precoVenda) -
            this.toNumber(sale.precoCompra) -
            this.toNumber(sale.taxas) -
            this.toNumber(sale.outrosCustos)
        );
    },

    getSaleCost(sale) {
        return (
            this.toNumber(sale.precoCompra) +
            this.toNumber(sale.taxas) +
            this.toNumber(sale.outrosCustos)
        );
    },

    // ==========================================
    // CADASTRO DE VENDAS
    // ==========================================

    createSale(data) {
        const validation = this.validateSale(data);

        if (!validation.valid) {
            return {
                success: false,
                errors: validation.errors
            };
        }

        const database = this.getData();
        const sale = this.normalizeSale(data);

        database.vendas.push(sale);
        this.saveData(database);

        return {
            success: true,
            data: sale
        };
    },

    getSale(id) {
        return this.getData().vendas.find(
            sale => sale.id === id
        ) || null;
    },

    updateSale(id, data) {
        const database = this.getData();
        const index = database.vendas.findIndex(
            sale => sale.id === id
        );

        if (index === -1) {
            return {
                success: false,
                errors: ["Venda não encontrada."]
            };
        }

        const validation = this.validateSale(data);

        if (!validation.valid) {
            return {
                success: false,
                errors: validation.errors
            };
        }

        const updatedSale = this.normalizeSale({
            ...database.vendas[index],
            ...data,
            id,
            createdAt: database.vendas[index].createdAt
        });

        database.vendas[index] = updatedSale;
        this.saveData(database);

        return {
            success: true,
            data: updatedSale
        };
    },

    deleteSale(id) {
        const database = this.getData();
        const initialLength = database.vendas.length;

        database.vendas = database.vendas.filter(
            sale => sale.id !== id
        );

        if (database.vendas.length === initialLength) {
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
    // CADASTRO DE CUSTOS OPERACIONAIS
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

    filterSales(filters = {}) {
        let sales = [...this.getData().vendas];

        if (filters.startDate) {
            sales = sales.filter(
                sale => sale.data >= filters.startDate
            );
        }

        if (filters.endDate) {
            sales = sales.filter(
                sale => sale.data <= filters.endDate
            );
        }

        if (filters.month !== undefined && filters.year !== undefined) {
            sales = sales.filter(sale => {
                const [year, month] = sale.data.split("-").map(Number);

                return (
                    month === Number(filters.month) + 1 &&
                    year === Number(filters.year)
                );
            });
        }

        if (filters.search) {
            const search = filters.search.toLowerCase();

            sales = sales.filter(sale =>
                sale.produto.toLowerCase().includes(search) ||
                sale.descricao.toLowerCase().includes(search)
            );
        }

        return sales.sort(
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
        const sales = this.filterSales(filters);
        const costs = this.filterCosts(filters);

        const totalVendas = sales.reduce(
            (total, sale) => total + this.toNumber(sale.precoVenda),
            0
        );

        const custoProdutos = sales.reduce(
            (total, sale) => total + this.toNumber(sale.precoCompra),
            0
        );

        const taxas = sales.reduce(
            (total, sale) => total + this.toNumber(sale.taxas),
            0
        );

        const outrosCustos = sales.reduce(
            (total, sale) => total + this.toNumber(sale.outrosCustos),
            0
        );

        const lucroVendas = sales.reduce(
            (total, sale) => total + this.calculateSaleProfit(sale),
            0
        );

        const custosFerramentas = costs
            .filter(cost => cost.categoria === "Ferramentas")
            .reduce((total, cost) => total + this.toNumber(cost.valor), 0);

        const custosOperacionais = costs.reduce(
            (total, cost) => total + this.toNumber(cost.valor),
            0
        );

        const lucroLiquido = lucroVendas - custosOperacionais;

        const investimentoTotal =
            custoProdutos +
            taxas +
            outrosCustos +
            custosOperacionais;

        const roi = investimentoTotal > 0
            ? (lucroLiquido / investimentoTotal) * 100
            : 0;

        return {
            quantidadeVendas: sales.length,
            faturamento: totalVendas,
            custoProdutos,
            taxas,
            outrosCustos,
            lucroVendas,
            custosFerramentas,
            custosOperacionais,
            lucroLiquido,
            investimentoTotal,
            roi
        };
    },

    getDashboardData(month, year) {
        const filters = {};

        if (month !== undefined && year !== undefined) {
            filters.month = month;
            filters.year = year;
        }

        const totals = this.calculateTotals(filters);

        return {
            ...totals,
            vendasRecentes: this.filterSales(filters).slice(0, 5),
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

        const sales = database.vendas.map(sale => ({
            ...sale,
            tipo: "venda",
            valor: sale.precoVenda,
            resultado: this.calculateSaleProfit(sale)
        }));

        const costs = database.custos.map(cost => ({
            ...cost,
            tipo: "custo",
            valor: cost.valor
        }));

        return [...sales, ...costs].sort(
            (a, b) => b.data.localeCompare(a.data)
        );
    },

    // ==========================================
    // INICIALIZAÇÃO
    // ==========================================

    initialize() {
        const database = this.getData();

        const normalized = {
            vendas: database.vendas.map(sale => ({
                ...sale,
                lucro: this.calculateSaleProfit(sale)
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

window.ML = ML;
