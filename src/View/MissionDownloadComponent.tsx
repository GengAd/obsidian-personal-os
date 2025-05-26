/** @jsxImportSource preact */
import { useState, useEffect, useRef } from 'preact/hooks';
import { useRef as useDomRef } from 'preact/hooks';
import { requestUrl, App } from 'obsidian';
import { unzipSync, strFromU8 } from 'fflate';

interface MissionDownloadComponentProps {
    missions: any;
    app: App;
}

export function MissionDownloadComponent({ missions, app }: MissionDownloadComponentProps) {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (missions) {
            setIsLoading(false);
        }
    }, [missions]);

    const handleMissionClick = async (mission: any) => {
        try {
            const res = await requestUrl({
                url: mission.url,
                method: 'GET',
                contentType: undefined 
            });
            const zipPath = app.vault.getRoot().path + '/' + mission.title;

            const zip = unzipSync(new Uint8Array(res.arrayBuffer));
            for (const [filename, content] of Object.entries(zip)) {
                const filePath = `${zipPath}/${filename}`;
                const fileContent = strFromU8(content);
                await app.vault.create(filePath, fileContent);
            }
        } catch (error) {
            console.error('Error downloading mission:', error);
        }
    }

    return (
        <div className="pos-missions-container">
            {isLoading ? (
                <div>Loading missions...</div>
            ) : (
                <>
                    <h1>Missions Available</h1>
                    <div className="pos-missions-grid">
                        {missions.map((mission: any, index: number) => (
                            <div 
                                key={index} 
                                className="pos-mission-card"
                                onClick={() => handleMissionClick(mission)}
                                role="button"
                                tabIndex={0}
                            >
                                <h2>{mission.title}</h2>
                                <p>{mission.description}</p>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}