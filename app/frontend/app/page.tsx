import Link from "next/link";

export default function HomePage() {
  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center gap-8 text-center">
      <div className="rounded-2xl bg-white/90 p-8 shadow-lg shadow-amber-900/5">
        <h1 className="text-3xl font-bold text-amber-900 sm:text-4xl">
          Список желаний для вас и друзей
        </h1>
        <p className="mt-4 max-w-xl text-stone-600">
          Создайте список подарков, поделитесь ссылкой — друзья смогут зарезервировать
          подарок или скинуться на большой. Именинник не узнает, кто что взял.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/auth/register"
            className="rounded-xl bg-amber-600 px-6 py-3 text-sm font-medium text-white shadow-md hover:bg-amber-700"
          >
            Создать аккаунт
          </Link>
          <Link
            href="/auth/login"
            className="rounded-xl border-2 border-amber-200 bg-white px-6 py-3 text-sm font-medium text-amber-800 hover:bg-amber-50"
          >
            Войти
          </Link>
        </div>
        <p className="mt-6 text-sm text-stone-500">
          Вам прислали ссылку на вишлист? Откройте её в браузере — регистрация не нужна.
        </p>
      </div>
    </section>
  );
}

