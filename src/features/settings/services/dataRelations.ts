type RelationSpec = {
  sourceTable: string;
  sourceField: string;
  targetTable: string;
  label: string;
};

export const DATA_RELATIONS: RelationSpec[] = [
  { sourceTable: "athleticsPlannedSessions", sourceField: "blockId", targetTable: "athleticsTrainingBlocks", label: "Training sessions without their block" },
  { sourceTable: "athleticsPlannedSessions", sourceField: "plannedActivityId", targetTable: "plannedActivities", label: "Training sessions without their Planner activity" },
  { sourceTable: "athleticsTrainingBlocks", sourceField: "templateId", targetTable: "athleticsBlockTemplates", label: "Training blocks without their template" },
  { sourceTable: "activityEvents", sourceField: "plannedActivityId", targetTable: "plannedActivities", label: "Activity history without its Planner activity" },
  { sourceTable: "xpEvents", sourceField: "activityEventId", targetTable: "activityEvents", label: "XP history without its activity event" },
  { sourceTable: "plannedActivities", sourceField: "templateId", targetTable: "activityTemplates", label: "Planner activities without their template" },
  { sourceTable: "plannedActivities", sourceField: "recurrenceRuleId", targetTable: "recurrenceRules", label: "Planner activities without their recurrence rule" },
  { sourceTable: "recurrenceRules", sourceField: "templateId", targetTable: "activityTemplates", label: "Recurrence rules without their template" },
  { sourceTable: "chineseActivities", sourceField: "plannedActivityId", targetTable: "plannedActivities", label: "Chinese logs without their Planner activity" },
  { sourceTable: "chineseActivities", sourceField: "activityEventId", targetTable: "activityEvents", label: "Chinese logs without their activity event" },
  { sourceTable: "chineseActivities", sourceField: "xpEventId", targetTable: "xpEvents", label: "Chinese logs without their XP event" },
  { sourceTable: "athleticsWorkouts", sourceField: "plannedActivityId", targetTable: "plannedActivities", label: "Workouts without their Planner activity" },
  { sourceTable: "athleticsWorkouts", sourceField: "activityEventId", targetTable: "activityEvents", label: "Workouts without their activity event" },
  { sourceTable: "athleticsWorkouts", sourceField: "xpEventId", targetTable: "xpEvents", label: "Workouts without their XP event" },
  { sourceTable: "cookingMealLogs", sourceField: "recipeId", targetTable: "cookingRecipes", label: "Meal history without its recipe" },
  { sourceTable: "cookingMealLogs", sourceField: "plannedActivityId", targetTable: "plannedActivities", label: "Meal history without its Planner activity" },
  { sourceTable: "cookingMealLogs", sourceField: "activityEventId", targetTable: "activityEvents", label: "Meal history without its activity event" },
  { sourceTable: "cookingMealLogs", sourceField: "xpEventId", targetTable: "xpEvents", label: "Meal history without its XP event" },
  { sourceTable: "groceryItems", sourceField: "recipeId", targetTable: "cookingRecipes", label: "Grocery items without their recipe" },
  { sourceTable: "libraryBooks", sourceField: "linkedJournalEntryId", targetTable: "journalEntries", label: "Books without their linked journal entry" },
  { sourceTable: "financeTransactions", sourceField: "accountId", targetTable: "financeAccounts", label: "Transactions without their account" },
  { sourceTable: "financeTransactions", sourceField: "fromAccountId", targetTable: "financeAccounts", label: "Transfers without their source account" },
  { sourceTable: "financeTransactions", sourceField: "toAccountId", targetTable: "financeAccounts", label: "Transfers without their destination account" },
  { sourceTable: "financeTransactions", sourceField: "categoryId", targetTable: "financeCategories", label: "Transactions without their category" },
  { sourceTable: "financeTransactions", sourceField: "subcategoryId", targetTable: "financeSubcategories", label: "Transactions without their subcategory" },
  { sourceTable: "financeTransactions", sourceField: "importBatchId", targetTable: "financeImportBatches", label: "Imported transactions without their import record" },
  { sourceTable: "financeSubcategories", sourceField: "categoryId", targetTable: "financeCategories", label: "Finance subcategories without their category" },
  { sourceTable: "financeBudgetAllocations", sourceField: "categoryId", targetTable: "financeCategories", label: "Budget plans without their category" },
  { sourceTable: "financeBudgetAllocations", sourceField: "subcategoryId", targetTable: "financeSubcategories", label: "Budget plans without their subcategory" },
  { sourceTable: "financeGoals", sourceField: "accountId", targetTable: "financeAccounts", label: "Finance goals without their account" },
  { sourceTable: "focusSessions", sourceField: "activityId", targetTable: "plannedActivities", label: "Focus history without its Planner activity" },
];

