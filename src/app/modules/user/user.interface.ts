import { BloodGroup } from "@prisma/client";

export interface RegisterUserPayload {
  phone: string;
  password: string;
}

export interface IDonor {
  name: string;
  address: string;
  contact_number: string;
  division: string;
  district: string;
  sub_district: string;
  blood_group: BloodGroup;
  last_donation_date: Date | null;
}
