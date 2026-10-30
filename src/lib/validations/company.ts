import { z } from "zod";

const required = (label: string) => z.string().trim().min(1, `${label} is required`);
const optional = z.string().trim().default("");
const count = (label: string) =>
  z.coerce.number({ message: `${label} must be a number` }).int().min(0, `${label} can't be negative`);

export const companySchema = z.object({
  nameTh: required("Thai company name"),
  nameEn: required("English company name"),
  taglineTh: optional,
  taglineEn: optional,
  descriptionTh: optional,
  descriptionEn: optional,
  yearEstablished: z.coerce.number().int().min(1800).max(2100),
  phone: required("Phone"),
  email: z.string().trim().email("Invalid email address"),
  lineId: optional,
  addressTh: required("Thai address"),
  addressEn: required("English address"),
  hoursTh: optional,
  hoursEn: optional,
  mapUrl: z.union([z.literal(""), z.string().trim().url("Map URL must be a link")]),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  statYears: count("Years"),
  statBrands: count("Brands"),
  statProducts: count("Products"),
  statClients: count("Clients"),
});
