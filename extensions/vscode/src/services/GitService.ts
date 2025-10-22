
import simpleGit from 'simple-git';

class GitService {

    async getCurrentBranchByPath(path: string): Promise<string> {
        const git = simpleGit(path);
        const defaultBranch = 'none';
        try {
            const branchSummary = await git.branch();
            return branchSummary.current || defaultBranch;
        } catch {
            return defaultBranch;
        }
    }

}

export default new GitService();