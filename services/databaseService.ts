
import { supabase } from './supabaseClient';
import { GeneratorMode, AppSection } from '../types';

export const saveGeneration = async (
    userId: string,
    imageUrl: string,
    prompt: string,
    mode: GeneratorMode,
    section: AppSection,
    projectId?: string
) => {
    const { data, error } = await supabase
        .from('generations')
        .insert([
            {
                user_id: userId,
                image_url: imageUrl,
                prompt: prompt,
                mode: mode,
                section: section,
                project_id: projectId
            }
        ])
        .select();

    if (error) {
        console.error('Error saving generation:', error);
        return null;
    }
    return data ? data[0] : null;
};

export const getUserHistory = async (userId: string) => {
    const { data, error } = await supabase
        .from('generations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching history:', error);
        return [];
    }

    return data.map(item => ({
        id: item.id,
        url: item.image_url,
        prompt: item.prompt,
        timestamp: new Date(item.created_at).getTime(),
        mode: item.mode,
        section: item.section,
        projectId: item.project_id
    }));
};

export const getProjectHistory = async (projectId: string) => {
    const { data, error } = await supabase
        .from('generations')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching project history:', error);
        return [];
    }

    return data.map(item => ({
        id: item.id,
        url: item.image_url,
        prompt: item.prompt,
        timestamp: new Date(item.created_at).getTime(),
        mode: item.mode,
        section: item.section
    }));
};
export const createProject = async (
    userId: string,
    title: string,
    mode: GeneratorMode,
    section: AppSection
) => {
    const { data, error } = await supabase
        .from('projects')
        .insert([
            {
                user_id: userId,
                title: title,
                mode: mode,
                section: section
            }
        ])
        .select();

    if (error) {
        console.error('Error creating project:', error);
        return null;
    }
    return data ? data[0] : null;
};

export const getProjects = async (userId: string) => {
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching projects:', error);
        return [];
    }
    return data;
};

export const deleteProject = async (projectId: string) => {
    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

    if (error) {
        console.error('Error deleting project:', error);
        return false;
    }
    return true;
};
