/**
 * Gerenciamento das categorias do sistema.
 *
 * Este módulo controla:
 * - categorias de receitas;
 * - categorias de gastos;
 * - criação de categorias;
 * - edição;
 * - exclusão;
 * - proteção de categorias em uso;
 * - integração com limites por categoria.
 */

const Categories = {
  /**
   * Tipos de categoria aceitos pelo sistema.
   */
  validTypes: ["receita", "gasto"],

  /**
   * Cores disponíveis para categorias.
   */
  defaultColors: [
    "#6558ff",
    "#4c62ff",
    "#e144d1",
    "#f3b93f",
    "#31c783",
    "#ff5b69",
    "#8379ff",
    "#38bdf8",
    "#f97316",
    "#a855f7",
    "#14b8a6",
    "#727786"
  ],

  /**
   * Converte o tipo da categoria para o nome
   * utilizado dentro do banco.
   *
   * receita → receitas
   * gasto → gastos
   */
  getSectionName(type) {
    const normalizedType = this.normalizeType(type);

    return normalizedType === "receita"
      ? "receitas"
      : "gastos";
  },

  /**
   * Normaliza e valida o tipo informado.
   */
  normalizeType(type) {
    const normalizedType = String(type || "")
      .trim()
      .toLowerCase();

    if (!this.validTypes.includes(normalizedType)) {
      throw new Error(
        'Tipo de categoria inválido. Use "receita" ou "gasto".'
      );
    }

    return normalizedType;
  },

  /**
   * Normaliza o nome da categoria.
   */
  normalizeName(name) {
    return String(name || "")
      .trim()
      .replace(/\s+/g, " ");
  },

  /**
   * Cria um texto seguro para ser utilizado no ID.
   *
   * Exemplo:
   * "Alimentação Fora" → "alimentacao-fora"
   */
  createSlug(text) {
    return String(text || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  },

  /**
   * Valida uma cor hexadecimal.
   */
  isValidColor(color) {
    return /^#[0-9a-f]{6}$/i.test(
      String(color || "").trim()
    );
  },

  /**
   * Retorna todas as categorias do sistema.
   */
  getAll() {
    const categories =
      Storage.getCategorias() || {
        receitas: [],
        gastos: []
      };

    return Utils.clone(categories);
  },

  /**
   * Retorna categorias de um tipo específico.
   *
   * Exemplo:
   * Categories.getByType("gasto")
   */
  getByType(type) {
    const sectionName = this.getSectionName(type);
    const categories = this.getAll();

    return Array.isArray(categories[sectionName])
      ? Utils.clone(categories[sectionName])
      : [];
  },

  /**
   * Retorna as categorias de receitas.
   */
  getReceitas() {
    return this.getByType("receita");
  },

  /**
   * Retorna as categorias de gastos.
   */
  getGastos() {
    return this.getByType("gasto");
  },

  /**
   * Procura uma categoria pelo ID.
   *
   * Caso o tipo seja informado, a busca ocorre
   * somente naquele grupo.
   */
  findById(categoryId, type = null) {
    if (!categoryId) {
      return null;
    }

    if (type) {
      const category = this.getByType(type).find(
        item => item.id === categoryId
      );

      return category
        ? Utils.clone(category)
        : null;
    }

    const categories = this.getAll();

    const allCategories = [
      ...(categories.receitas || []),
      ...(categories.gastos || [])
    ];

    const category = allCategories.find(
      item => item.id === categoryId
    );

    return category
      ? Utils.clone(category)
      : null;
  },

  /**
   * Procura uma categoria pelo nome.
   */
  findByName(name, type) {
    const normalizedName = this.normalizeName(name)
      .toLowerCase();

    const category = this.getByType(type).find(
      item =>
        this.normalizeName(item.nome).toLowerCase() ===
        normalizedName
    );

    return category
      ? Utils.clone(category)
      : null;
  },

  /**
   * Verifica se já existe uma categoria com o nome
   * informado dentro do mesmo tipo.
   */
  nameExists(name, type, ignoredCategoryId = null) {
    const normalizedName = this.normalizeName(name)
      .toLowerCase();

    return this.getByType(type).some(category => {
      const sameName =
        this.normalizeName(category.nome).toLowerCase() ===
        normalizedName;

      const isIgnoredCategory =
        category.id === ignoredCategoryId;

      return sameName && !isIgnoredCategory;
    });
  },

  /**
   * Gera um ID único para uma nova categoria.
   */
  generateCategoryId(name, type) {
    const sectionName = this.getSectionName(type);
    const categories = this.getByType(type);

    const baseId =
      this.createSlug(name) ||
      Utils.generateId("categoria");

    let categoryId = baseId;
    let counter = 2;

    while (
      categories.some(category => category.id === categoryId)
    ) {
      categoryId = `${baseId}-${counter}`;
      counter += 1;
    }

    /*
     * Evita conflito entre uma categoria de receita
     * e outra categoria de gasto com o mesmo ID.
     */
    const categoryFromOtherSection =
      this.findById(categoryId);

    if (categoryFromOtherSection) {
      categoryId = `${categoryId}-${sectionName.slice(0, -1)}`;
    }

    return categoryId;
  },

  /**
   * Valida os dados de uma categoria.
   */
  validateCategoryData(categoryData, ignoredCategoryId = null) {
    const type = this.normalizeType(categoryData.tipo);
    const name = this.normalizeName(categoryData.nome);

    if (!name) {
      throw new Error(
        "Informe o nome da categoria."
      );
    }

    if (name.length < 2) {
      throw new Error(
        "O nome da categoria deve ter pelo menos 2 caracteres."
      );
    }

    if (name.length > 40) {
      throw new Error(
        "O nome da categoria deve ter no máximo 40 caracteres."
      );
    }

    if (
      this.nameExists(
        name,
        type,
        ignoredCategoryId
      )
    ) {
      throw new Error(
        `Já existe uma categoria chamada "${name}".`
      );
    }

    const selectedColor =
      String(categoryData.cor || "").trim();

    const color = this.isValidColor(selectedColor)
      ? selectedColor
      : this.defaultColors[0];

    return {
      nome: name,
      tipo: type,
      cor: color
    };
  },

  /**
   * Cria uma nova categoria.
   *
   * Exemplo:
   *
   * Categories.create({
   *   nome: "Academia",
   *   tipo: "gasto",
   *   cor: "#6558ff"
   * })
   */
  create(categoryData) {
    if (
      !categoryData ||
      typeof categoryData !== "object"
    ) {
      throw new Error(
        "Os dados da categoria são inválidos."
      );
    }

    const validatedData =
      this.validateCategoryData(categoryData);

    const categories = this.getAll();

    const sectionName = this.getSectionName(
      validatedData.tipo
    );

    const newCategory = {
      id: this.generateCategoryId(
        validatedData.nome,
        validatedData.tipo
      ),

      nome: validatedData.nome,
      tipo: validatedData.tipo,
      cor: validatedData.cor,

      padrao: false,
      criadaEm: new Date().toISOString(),
      atualizadaEm: new Date().toISOString()
    };

    categories[sectionName].push(newCategory);

    Storage.updateSection(
      "categorias",
      categories
    );

    /*
     * Categorias de gasto recebem automaticamente
     * uma entrada de limite com valor inicial zero.
     */
    if (validatedData.tipo === "gasto") {
      this.ensureCategoryLimit(newCategory.id);
    }

    return Utils.clone(newCategory);
  },

  /**
   * Edita uma categoria existente.
   */
  update(categoryId, changes) {
    if (!categoryId) {
      throw new Error(
        "Informe o ID da categoria."
      );
    }

    const currentCategory =
      this.findById(categoryId);

    if (!currentCategory) {
      throw new Error(
        "Categoria não encontrada."
      );
    }

    const categoryData = {
      nome:
        changes?.nome ??
        currentCategory.nome,

      tipo:
        changes?.tipo ??
        currentCategory.tipo,

      cor:
        changes?.cor ??
        currentCategory.cor
    };

    const validatedData =
      this.validateCategoryData(
        categoryData,
        categoryId
      );

    /*
     * Nesta primeira versão, não permitimos transformar
     * uma categoria de receita em gasto ou vice-versa.
     *
     * Isso evita inconsistência com lançamentos antigos.
     */
    if (
      validatedData.tipo !== currentCategory.tipo
    ) {
      throw new Error(
        "Não é possível alterar o tipo de uma categoria já criada."
      );
    }

    const categories = this.getAll();

    const sectionName = this.getSectionName(
      currentCategory.tipo
    );

    const categoryIndex =
      categories[sectionName].findIndex(
        category => category.id === categoryId
      );

    if (categoryIndex === -1) {
      throw new Error(
        "Categoria não encontrada."
      );
    }

    const updatedCategory = {
      ...categories[sectionName][categoryIndex],

      nome: validatedData.nome,
      cor: validatedData.cor,

      atualizadaEm: new Date().toISOString()
    };

    categories[sectionName][categoryIndex] =
      updatedCategory;

    Storage.updateSection(
      "categorias",
      categories
    );

    return Utils.clone(updatedCategory);
  },

  /**
   * Verifica se uma categoria está sendo utilizada
   * em alguma receita ou gasto.
   */
  isInUse(categoryId, type = null) {
    const category =
      this.findById(categoryId, type);

    if (!category) {
      return false;
    }

    if (category.tipo === "receita") {
      return Storage.getReceitas().some(
        receita =>
          receita.categoriaId === categoryId ||
          receita.categoria === categoryId ||
          receita.categoria === category.nome
      );
    }

    return Storage.getGastos().some(
      gasto =>
        gasto.categoriaId === categoryId ||
        gasto.categoria === categoryId ||
        gasto.categoria === category.nome
    );
  },

  /**
   * Conta quantos lançamentos utilizam uma categoria.
   */
  countUsage(categoryId, type = null) {
    const category =
      this.findById(categoryId, type);

    if (!category) {
      return 0;
    }

    const records =
      category.tipo === "receita"
        ? Storage.getReceitas()
        : Storage.getGastos();

    return records.filter(record => {
      return (
        record.categoriaId === categoryId ||
        record.categoria === categoryId ||
        record.categoria === category.nome
      );
    }).length;
  },

  /**
   * Exclui uma categoria.
   *
   * Regras:
   * - categoria padrão não pode ser excluída;
   * - categoria em uso não pode ser excluída;
   * - ao excluir uma categoria de gasto, seu limite
   *   também é removido.
   */
  delete(categoryId, type = null) {
    const category =
      this.findById(categoryId, type);

    if (!category) {
      return {
        success: false,
        error: "Categoria não encontrada."
      };
    }

    if (category.padrao) {
      return {
        success: false,
        error:
          "Categorias padrão não podem ser excluídas. Elas podem apenas ser editadas."
      };
    }

    const usageCount =
      this.countUsage(categoryId, category.tipo);

    if (usageCount > 0) {
      return {
        success: false,
        error:
          `Esta categoria está sendo utilizada em ${usageCount} lançamento(s).`
      };
    }

    const categories = this.getAll();

    const sectionName = this.getSectionName(
      category.tipo
    );

    categories[sectionName] =
      categories[sectionName].filter(
        item => item.id !== categoryId
      );

    Storage.updateSection(
      "categorias",
      categories
    );

    if (category.tipo === "gasto") {
      this.removeCategoryLimit(categoryId);
    }

    return {
      success: true,
      category: Utils.clone(category)
    };
  },

  /**
   * Garante que uma categoria de gasto tenha
   * um limite correspondente.
   */
  ensureCategoryLimit(categoryId) {
    const limits =
      Storage.getLimites() || {};

    if (
      !limits.categorias ||
      typeof limits.categorias !== "object"
    ) {
      limits.categorias = {};
    }

    if (!(categoryId in limits.categorias)) {
      limits.categorias[categoryId] = 0;

      Storage.updateSection(
        "limites",
        limits
      );
    }

    return limits.categorias[categoryId];
  },

  /**
   * Remove o limite de uma categoria excluída.
   */
  removeCategoryLimit(categoryId) {
    const limits =
      Storage.getLimites() || {};

    if (
      !limits.categorias ||
      !(categoryId in limits.categorias)
    ) {
      return false;
    }

    delete limits.categorias[categoryId];

    Storage.updateSection(
      "limites",
      limits
    );

    return true;
  },

  /**
   * Retorna o limite cadastrado para uma categoria.
   */
  getCategoryLimit(categoryId) {
    const limits =
      Storage.getLimites() || {};

    const categoryLimit =
      limits.categorias?.[categoryId];

    return Number(categoryLimit) || 0;
  },

  /**
   * Define o limite mensal de uma categoria.
   */
  setCategoryLimit(categoryId, value) {
    const category =
      this.findById(categoryId, "gasto");

    if (!category) {
      throw new Error(
        "Categoria de gasto não encontrada."
      );
    }

    const numericValue = Number(value);

    if (
      !Number.isFinite(numericValue) ||
      numericValue < 0
    ) {
      throw new Error(
        "O limite da categoria deve ser um número maior ou igual a zero."
      );
    }

    const limits =
      Storage.getLimites() || {};

    if (
      !limits.categorias ||
      typeof limits.categorias !== "object"
    ) {
      limits.categorias = {};
    }

    limits.categorias[categoryId] =
      numericValue;

    Storage.updateSection(
      "limites",
      limits
    );

    return numericValue;
  },

  /**
   * Retorna categorias de gasto junto com seus limites.
   */
  getGastosWithLimits() {
    return this.getGastos().map(category => ({
      ...category,
      limite: this.getCategoryLimit(category.id)
    }));
  },

  /**
   * Retorna uma cor automática para nova categoria.
   *
   * A função tenta usar a cor menos utilizada.
   */
  getSuggestedColor(type) {
    const categories = this.getByType(type);

    const colorUsage = this.defaultColors.reduce(
      (usage, color) => {
        usage[color.toLowerCase()] = 0;
        return usage;
      },
      {}
    );

    categories.forEach(category => {
      const categoryColor =
        String(category.cor || "").toLowerCase();

      if (categoryColor in colorUsage) {
        colorUsage[categoryColor] += 1;
      }
    });

    return this.defaultColors.reduce(
      (selectedColor, currentColor) => {
        const selectedUsage =
          colorUsage[selectedColor.toLowerCase()];

        const currentUsage =
          colorUsage[currentColor.toLowerCase()];

        return currentUsage < selectedUsage
          ? currentColor
          : selectedColor;
      },
      this.defaultColors[0]
    );
  },

  /**
   * Corrige categorias e limites antigos que possam
   * estar incompletos.
   */
  synchronizeLimits() {
    const expenseCategories =
      this.getGastos();

    const limits =
      Storage.getLimites() || {};

    if (
      !limits.categorias ||
      typeof limits.categorias !== "object"
    ) {
      limits.categorias = {};
    }

    let databaseChanged = false;

    expenseCategories.forEach(category => {
      if (!(category.id in limits.categorias)) {
        limits.categorias[category.id] = 0;
        databaseChanged = true;
      }
    });

    /*
     * Remove limites órfãos apenas quando não existe
     * nenhuma categoria correspondente.
     */
    Object.keys(limits.categorias).forEach(
      categoryId => {
        const categoryExists =
          expenseCategories.some(
            category => category.id === categoryId
          );

        if (!categoryExists) {
          delete limits.categorias[categoryId];
          databaseChanged = true;
        }
      }
    );

    if (databaseChanged) {
      Storage.updateSection(
        "limites",
        limits
      );
    }

    return Utils.clone(limits.categorias);
  },

  /**
   * Inicialização do módulo.
   */
  initialize() {
    Storage.initialize();

    this.synchronizeLimits();

    return this.getAll();
  }
};

window.Categories = Categories;