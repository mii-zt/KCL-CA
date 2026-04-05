import { NextResponse } from "next/server";
import { adminDb } from "@/utils/firebase/server";
import { adminTimestamp } from "@/utils/firebase/server";



// --- POST: 卵の採取記録を保存 ---
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { coop_number, count , worker_name} = data;

    // 必須フィールドのチェック
    if (coop_number === undefined || count === undefined || worker_name === undefined) {
      return NextResponse.json(
        { message: '鶏舎番号 (coop_number) と個数 (count) と作業者名 (worker_name) は必須です。' },
        { status: 400 }
      );
    }

    // 数値への変換
    const coopNumberInt = Number(coop_number);
    const countInt = Number(count);

    // バリデーション
    if (isNaN(coopNumberInt) || isNaN(countInt) || coopNumberInt < 1 || coopNumberInt > 9 || countInt < 0) {
      return NextResponse.json(
        { message: '鶏舎番号は1-9の整数、個数は0以上の整数である必要があります。' },
        { status: 400 }
      );
    }

    // Firestoreの "eggs" コレクションに保存
    const docRef = await adminDb.collection("eggs").add({
      coop_number: coopNumberInt,
      count: countInt,
      worker_name: worker_name,
      date: adminTimestamp.now(),
    });

    return NextResponse.json(
      { message: '卵の数を正常に記録しました！', id: docRef.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Firestore Eggデータ保存エラー:', error);
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました。Firestoreの接続を確認してください。' },
      { status: 500 }
    );
  }
}

// --- GET: 卵の記録一覧を取得 ---
export async function GET() {
  try {

    const snapshot = await adminDb
      .collection("eggs")
      .orderBy("date", "desc")
      .get();


    const eggList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Timestamp型をJavaScriptの日付に変換するよ🌸
      date: doc.data().date?.toDate ? doc.data().date.toDate() : doc.data().date
    }));

    return NextResponse.json(eggList, { status: 200 });
  } catch (error) {
    console.error('Firestore Eggデータ取得エラー:', error);
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました。一覧データの取得に失敗しました。' },
      { status: 500 }
    );
  }
}