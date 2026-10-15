namespace MacroGuard.Infrastructure.Security;

public static class EnvLoader
{
    private static bool _loaded;

    public static void Load()
    {
        if (_loaded) return;
        _loaded = true;

        var startDirs = new[]
        {
            Directory.GetCurrentDirectory(),
            AppContext.BaseDirectory
        };

        foreach (var startDir in startDirs)
        {
            try
            {
                var dir = new DirectoryInfo(startDir);
                while (dir != null)
                {
                    var envPath = Path.Combine(dir.FullName, ".env");
                    if (File.Exists(envPath))
                    {
                        ParseAndApplyEnv(envPath);
                        return;
                    }
                    dir = dir.Parent;
                }
            }
            catch
            {
                // Ignoruj błędy przeszukiwania katalogów
            }
        }
    }

    private static void ParseAndApplyEnv(string filePath)
    {
        try
        {
            foreach (var line in File.ReadAllLines(filePath))
            {
                var trimmed = line.Trim();
                if (string.IsNullOrWhiteSpace(trimmed) || trimmed.StartsWith('#'))
                    continue;

                var separatorIdx = trimmed.IndexOf('=');
                if (separatorIdx > 0)
                {
                    var key = trimmed[..separatorIdx].Trim();
                    var val = trimmed[(separatorIdx + 1)..].Trim();

                    if (val.StartsWith('"') && val.EndsWith('"') && val.Length >= 2)
                        val = val[1..^1];
                    else if (val.StartsWith('\'') && val.EndsWith('\'') && val.Length >= 2)
                        val = val[1..^1];

                    if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable(key)))
                    {
                        Environment.SetEnvironmentVariable(key, val);
                    }
                }
            }
        }
        catch
        {
            // Ignoruj błędy odczytu
        }
    }
}
