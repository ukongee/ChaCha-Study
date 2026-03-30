import { createClient } from "@/lib/supabase/client";

export const authApi = {
  login: async (data: { email: string; password: string }) => {
    const supabase = createClient();
    const { data: result, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return result;
  },

  signup: async (data: { email: string; password: string; name: string }) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { name: data.name } },
    });
    if (error) throw new Error(error.message);
  },

  signOut: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
  },

  getUser: async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },
};
