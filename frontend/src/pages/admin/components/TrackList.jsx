import React from 'react';

const TrackList = ({ tracks }) => {
    if (!tracks || tracks.length === 0) {
        return <p className="text-gray-500 text-sm">No tracks created yet.</p>;
    }

    return (
        <div className="space-y-3">
            {tracks.map(track => (
                <div key={track._id || track.name} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border">
                    <div>
                        <h4 className="font-semibold text-gray-900">{track.name}</h4>
                        <p className="text-sm text-gray-500">{track.description}</p>
                    </div>
                    <div className="text-right">
                        <span className="text-sm font-medium text-gray-700">{track.currentCount} / {track.capacity}</span>
                        <div className="text-xs text-gray-400 mt-1">{track.isLocked ? 'Locked' : 'Open'}</div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TrackList;
