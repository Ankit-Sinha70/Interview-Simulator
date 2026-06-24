import mongoose from 'mongoose';

export async function getLeaderboard(): Promise<{ name: string; averageScore: number; totalSessions: number }[]> {
    // Aggregate from InterviewSession — group by userId, compute avg overallScore
    const results = await mongoose.connection.collection('interviewsessions').aggregate([
        { $match: { status: 'completed', overallScore: { $gt: 0 } } },
        {
            $group: {
                _id: '$userId',
                averageScore: { $avg: '$overallScore' },
                totalSessions: { $sum: 1 },
            },
        },
        { $sort: { averageScore: -1 } },
        { $limit: 10 },
        {
            $lookup: {
                from: 'users',
                let: { uid: { $toObjectId: '$_id' } },
                pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$uid'] } } }],
                as: 'user',
            },
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        {
            $project: {
                _id: 0,
                name: { $ifNull: ['$user.name', 'Anonymous'] },
                averageScore: { $round: ['$averageScore', 1] },
                totalSessions: 1,
            },
        },
    ]).toArray();

    return results as { name: string; averageScore: number; totalSessions: number }[];
}
