import express from "express";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { env, hasSupabaseConfig } from "./config/env.js";
import {
  getSupabaseAdminClient,
  getSupabaseClient,
} from "./lib/supabase.js";
import {
  parsePartFilters,
  parseResultLimit,
  sanitizeSearchPattern,
} from "./lib/part-filters.js";

export const app = express();

app.disable("x-powered-by");
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({
    status: "ok",
    supabaseConfigured: hasSupabaseConfig(),
  });
});

app.get("/api/parts/options", async (_request, response) => {
  try {
    const { data, error } = await getSupabaseClient()
      .from("parts")
      .select("plant_code, reference_year, calculation_method, product_class");

    if (error) {
      throw error;
    }

    const unique = <T extends string | number>(
      values: Array<T | null>,
    ): T[] => [...new Set(values.filter((value): value is T => value !== null))].sort();

    response.json({
      plantCodes: unique(data.map((part) => part.plant_code)),
      referenceYears: unique(data.map((part) => part.reference_year)).sort(
        (a, b) => b - a,
      ),
      calculationMethods: unique(data.map((part) => part.calculation_method)),
      productClasses: unique(data.map((part) => part.product_class)),
    });
  } catch (error) {
    handleApiError(response, error);
  }
});

app.get("/api/parts", async (request, response) => {
  try {
    const filters = parsePartFilters(request.query);
    const limit = parseResultLimit(request.query.limit);
    let query = getSupabaseClient()
      .from("parts")
      .select("*", { count: "exact" })
      .order("name", { ascending: true })
      .limit(limit);

    if (filters.partNumber) {
      query = query.ilike(
        "part_number",
        `%${sanitizeSearchPattern(filters.partNumber)}%`,
      );
    }
    if (filters.plantCode) {
      query = query.eq("plant_code", filters.plantCode);
    }
    if (filters.referenceYear) {
      query = query.eq("reference_year", filters.referenceYear);
    }
    if (filters.calculationMethod) {
      query = query.eq("calculation_method", filters.calculationMethod);
    }
    if (filters.productClass) {
      query = query.eq("product_class", filters.productClass);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    response.json({ data, count: count ?? data.length });
  } catch (error) {
    handleApiError(response, error);
  }
});

app.get("/api/parts/:id", async (request, response) => {
  try {
    const { data, error } = await getSupabaseClient()
      .from("parts")
      .select("*")
      .eq("id", request.params.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      response.status(404).json({ error: "Part not found." });
      return;
    }

    response.json(data);
  } catch (error) {
    handleApiError(response, error);
  }
});

app.post("/api/parts/:id/confirm", async (request, response) => {
  try {
    const { data, error } = await getSupabaseAdminClient()
      .from("parts")
      .update({ status: "Complete" })
      .eq("id", request.params.id)
      .select("*")
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      response.status(404).json({ error: "Part not found." });
      return;
    }

    response.json(data);
  } catch (error) {
    handleApiError(response, error);
  }
});

if (env.nodeEnv === "production") {
  const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
  const clientDirectory = path.resolve(currentDirectory, "../client");

  app.use(express.static(clientDirectory));
  app.use((_request, response) => {
    response.sendFile(path.join(clientDirectory, "index.html"));
  });
}

function handleApiError(
  response: express.Response,
  error: unknown,
): void {
  console.error(error);
  response.status(500).json({
    error:
      error instanceof Error
        ? error.message
        : "The requested data could not be loaded.",
  });
}

if (process.env.NODE_ENV !== "test") {
  app.listen(env.port, () => {
    console.log(`PCF API listening on http://localhost:${env.port}`);
  });
}
